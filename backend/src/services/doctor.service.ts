import type { QueryFilter } from 'mongoose';
import { Doctor, type DoctorDoc } from '../models/Doctor';
import { Patient } from '../models/Patient';
import { ApiError } from '../utils/ApiError';
import { createdAtRange } from '../utils/dates';
import { escapeRegex } from '../utils/regex';
import { buildPagination } from '../utils/response';
import { serialize } from '../utils/serialize';
import type { CreateDoctorInput, ListDoctorsQuery, UpdateDoctorInput } from '../validators/doctor.validators';

type DoctorLean = DoctorDoc & { _id: unknown; __v?: number };

/** Patient counts for a set of doctors in a single grouped query (served by the {doctorId, createdAt} index). */
async function patientCounts(doctorIds: unknown[]) {
  if (!doctorIds.length) return new Map<string, number>();
  const rows = await Patient.aggregate<{ _id: unknown; count: number }>([
    { $match: { doctorId: { $in: doctorIds } } },
    { $group: { _id: '$doctorId', count: { $sum: 1 } } },
  ]);
  return new Map(rows.map((r) => [String(r._id), r.count]));
}

export async function listDoctors(q: ListDoctorsQuery) {
  const filter: QueryFilter<DoctorDoc> = {};
  if (q.specialization) filter.specialization = q.specialization;
  if (q.hospital) filter.hospital = q.hospital;
  const range = createdAtRange(q.from, q.to);
  if (range) filter.createdAt = range;
  if (q.search) {
    const rx = new RegExp(escapeRegex(q.search), 'i');
    filter.$or = [{ name: rx }, { specialization: rx }, { hospital: rx }, { email: rx }, { phone: rx }];
  }

  const sort = { [q.sortBy]: q.order === 'asc' ? 1 : -1, _id: -1 } as const;
  const [items, total] = await Promise.all([
    Doctor.find(filter)
      .sort(sort)
      .skip((q.page - 1) * q.limit)
      .limit(q.limit)
      .lean(),
    Doctor.countDocuments(filter),
  ]);

  const counts = await patientCounts(items.map((d) => d._id));
  return {
    items: items.map((d) => ({ ...serialize(d as DoctorLean), patientCount: counts.get(String(d._id)) ?? 0 })),
    pagination: buildPagination(q.page, q.limit, total),
  };
}

export async function getDoctor(id: string) {
  const doctor = await Doctor.findById(id).lean();
  if (!doctor) throw ApiError.notFound('Doctor not found');
  const patientCount = await Patient.countDocuments({ doctorId: id });
  return { ...serialize(doctor as DoctorLean), patientCount };
}

export async function createDoctor(input: CreateDoctorInput) {
  const doctor = await Doctor.create(input);
  return { ...serialize(doctor.toObject() as DoctorLean), patientCount: 0 };
}

export async function updateDoctor(id: string, input: UpdateDoctorInput) {
  const doctor = await Doctor.findByIdAndUpdate(id, { $set: input }, { returnDocument: 'after', runValidators: true }).lean();
  if (!doctor) throw ApiError.notFound('Doctor not found');
  const patientCount = await Patient.countDocuments({ doctorId: id });
  return { ...serialize(doctor as DoctorLean), patientCount };
}

/**
 * Deletion policy (no orphaned patients, ever):
 *  - doctor has no patients            -> deleted
 *  - doctor has patients, no option    -> 409 with the patient count (nothing changes)
 *  - `reassignTo=<doctorId>`           -> patients are moved first, then the doctor is deleted
 *  - `cascade=true`                    -> patients are deleted first, then the doctor
 * Dependent writes happen BEFORE the doctor is removed, so a mid-way failure can never leave patients
 * pointing at a missing doctor.
 */
export async function deleteDoctor(id: string, opts: { cascade: boolean; reassignTo?: string }) {
  const doctor = await Doctor.exists({ _id: id });
  if (!doctor) throw ApiError.notFound('Doctor not found');

  const patientCount = await Patient.countDocuments({ doctorId: id });
  let reassigned = 0;
  let removedPatients = 0;

  if (patientCount > 0) {
    if (opts.reassignTo) {
      if (opts.reassignTo === id) throw ApiError.badRequest('Cannot reassign patients to the doctor being deleted');
      if (!(await Doctor.exists({ _id: opts.reassignTo }))) throw ApiError.badRequest('Target doctor does not exist');
      reassigned = (await Patient.updateMany({ doctorId: id }, { $set: { doctorId: opts.reassignTo } })).modifiedCount;
    } else if (opts.cascade) {
      removedPatients = (await Patient.deleteMany({ doctorId: id })).deletedCount;
    } else {
      throw ApiError.conflict(
        `This doctor has ${patientCount} patient${patientCount === 1 ? '' : 's'}. Reassign them to another doctor or delete them together with the doctor.`,
        { patientCount },
      );
    }
  }

  await Doctor.deleteOne({ _id: id });
  return { reassigned, removedPatients };
}

/** Distinct values powering the filter dropdowns. */
export async function doctorFilterOptions() {
  const [specializations, hospitals] = await Promise.all([
    Doctor.distinct('specialization'),
    Doctor.distinct('hospital'),
  ]);
  const sort = (a: string, b: string) => a.localeCompare(b);
  return { specializations: specializations.sort(sort), hospitals: hospitals.sort(sort) };
}

/** Lightweight id/name list for doctor selectors (patient form + filter). Capped for safety. */
export async function doctorOptions() {
  const docs = await Doctor.find().select('name specialization').sort({ name: 1 }).limit(500).lean();
  return docs.map((d) => serialize(d));
}
