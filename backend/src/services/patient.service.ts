import type { QueryFilter } from 'mongoose';
import { Doctor } from '../models/Doctor';
import { Patient, type PatientDoc } from '../models/Patient';
import { ApiError } from '../utils/ApiError';
import { createdAtRange } from '../utils/dates';
import { escapeRegex } from '../utils/regex';
import { buildPagination } from '../utils/response';
import { serialize } from '../utils/serialize';
import type {
  CreatePatientInput,
  ListPatientsQuery,
  UpdatePatientInput,
} from '../validators/patient.validators';

const DOCTOR_SUMMARY_FIELDS = 'name specialization hospital';

type PatientLean = PatientDoc & { _id: unknown; __v?: number };

/**
 * Resolves each patient's doctor with ONE `$in` query for the whole page (instead of N lookups
 * or a populate round trip per document) and returns API DTOs.
 */
async function withDoctors(patients: PatientLean[]) {
  const ids = [...new Set(patients.map((p) => String(p.doctorId)))];
  const doctors = ids.length ? await Doctor.find({ _id: { $in: ids } }).select(DOCTOR_SUMMARY_FIELDS).lean() : [];
  const byId = new Map(doctors.map((d) => [String(d._id), serialize(d)]));
  return patients.map((p) => ({ ...serialize(p), doctorId: String(p.doctorId), doctor: byId.get(String(p.doctorId)) ?? null }));
}

async function buildFilter(q: Pick<ListPatientsQuery, 'search' | 'condition' | 'gender' | 'doctorId' | 'from' | 'to'>) {
  const filter: QueryFilter<PatientDoc> = {};

  if (q.condition) filter.condition = q.condition;
  if (q.gender) filter.gender = q.gender;
  if (q.doctorId) filter.doctorId = q.doctorId;
  const range = createdAtRange(q.from, q.to);
  if (range) filter.createdAt = range;

  if (q.search) {
    const rx = new RegExp(escapeRegex(q.search), 'i');
    // "Assigned doctor" search: resolve matching doctor ids first (small, indexed query) rather than $lookup-ing every patient.
    const matchingDoctors = await Doctor.find({ name: rx }).select('_id').limit(50).lean();
    filter.$or = [
      { fullName: rx },
      { phone: rx },
      { email: rx },
      ...(matchingDoctors.length ? [{ doctorId: { $in: matchingDoctors.map((d) => d._id) } }] : []),
    ];
  }
  return filter;
}

export async function listPatients(q: ListPatientsQuery) {
  const filter = await buildFilter(q);
  const sort = { [q.sortBy]: q.order === 'asc' ? 1 : -1, _id: -1 } as const;

  const [items, total] = await Promise.all([
    Patient.find(filter)
      .sort(sort)
      .skip((q.page - 1) * q.limit)
      .limit(q.limit)
      .lean(),
    Patient.countDocuments(filter),
  ]);

  return { items: await withDoctors(items as PatientLean[]), pagination: buildPagination(q.page, q.limit, total) };
}

export async function getPatient(id: string) {
  const patient = await Patient.findById(id).lean();
  if (!patient) throw ApiError.notFound('Patient not found');
  return (await withDoctors([patient as PatientLean]))[0];
}

async function assertDoctorExists(doctorId: string) {
  if (!(await Doctor.exists({ _id: doctorId }))) throw ApiError.badRequest('Selected doctor does not exist');
}

export async function createPatient(input: CreatePatientInput) {
  await assertDoctorExists(input.doctorId);
  const { email, ...rest } = input;
  const created = await Patient.create({ ...rest, ...(email ? { email } : {}) });
  return getPatient(String(created._id));
}

export async function updatePatient(id: string, input: UpdatePatientInput) {
  if (input.doctorId) await assertDoctorExists(input.doctorId);

  const { email, ...rest } = input;
  const update: Record<string, unknown> = { $set: { ...rest } };
  if (email !== undefined) {
    if (email) (update.$set as Record<string, unknown>).email = email;
    else update.$unset = { email: 1 };
  }

  const updated = await Patient.findByIdAndUpdate(id, update, { returnDocument: 'after', runValidators: true }).lean();
  if (!updated) throw ApiError.notFound('Patient not found');
  return (await withDoctors([updated as PatientLean]))[0];
}

export async function deletePatient(id: string) {
  const deleted = await Patient.findByIdAndDelete(id).select('_id').lean();
  if (!deleted) throw ApiError.notFound('Patient not found');
}
