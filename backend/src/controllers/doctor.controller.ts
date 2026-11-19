import type { RequestHandler } from 'express';
import * as doctorService from '../services/doctor.service';
import * as patientService from '../services/patient.service';
import { sendSuccess } from '../utils/response';
import type { ListPatientsQuery } from '../validators/patient.validators';

export const list: RequestHandler = async (req, res) => {
  const { items, pagination } = await doctorService.listDoctors(req.validatedQuery);
  sendSuccess(res, 'Doctors retrieved successfully', items, { pagination });
};

export const filterOptions: RequestHandler = async (_req, res) => {
  sendSuccess(res, 'Doctor filter options retrieved successfully', await doctorService.doctorFilterOptions());
};

export const options: RequestHandler = async (_req, res) => {
  sendSuccess(res, 'Doctor options retrieved successfully', await doctorService.doctorOptions());
};

export const getOne: RequestHandler = async (req, res) => {
  sendSuccess(res, 'Doctor retrieved successfully', await doctorService.getDoctor(req.validatedParams.id));
};

export const create: RequestHandler = async (req, res) => {
  sendSuccess(res, 'Doctor created successfully', await doctorService.createDoctor(req.body), { status: 201 });
};

export const update: RequestHandler = async (req, res) => {
  sendSuccess(res, 'Doctor updated successfully', await doctorService.updateDoctor(req.validatedParams.id, req.body));
};

export const remove: RequestHandler = async (req, res) => {
  const result = await doctorService.deleteDoctor(req.validatedParams.id, req.validatedQuery);
  sendSuccess(res, 'Doctor deleted successfully', result);
};

export const listPatients: RequestHandler = async (req, res) => {
  const query: ListPatientsQuery = { ...req.validatedQuery, doctorId: req.validatedParams.id };
  await doctorService.getDoctor(req.validatedParams.id); // 404 when the doctor doesn't exist
  const { items, pagination } = await patientService.listPatients(query);
  sendSuccess(res, 'Doctor patients retrieved successfully', items, { pagination });
};

export const addPatient: RequestHandler = async (req, res) => {
  const patient = await patientService.createPatient({ ...req.body, doctorId: req.validatedParams.id });
  sendSuccess(res, 'Patient added to doctor successfully', patient, { status: 201 });
};
