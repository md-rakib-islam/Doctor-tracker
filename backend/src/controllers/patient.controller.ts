import type { RequestHandler } from 'express';
import * as patientService from '../services/patient.service';
import { sendSuccess } from '../utils/response';

export const list: RequestHandler = async (req, res) => {
  const { items, pagination } = await patientService.listPatients(req.validatedQuery);
  sendSuccess(res, 'Patients retrieved successfully', items, { pagination });
};

export const getOne: RequestHandler = async (req, res) => {
  sendSuccess(res, 'Patient retrieved successfully', await patientService.getPatient(req.validatedParams.id));
};

export const create: RequestHandler = async (req, res) => {
  sendSuccess(res, 'Patient created successfully', await patientService.createPatient(req.body), { status: 201 });
};

export const update: RequestHandler = async (req, res) => {
  sendSuccess(res, 'Patient updated successfully', await patientService.updatePatient(req.validatedParams.id, req.body));
};

export const remove: RequestHandler = async (req, res) => {
  await patientService.deletePatient(req.validatedParams.id);
  sendSuccess(res, 'Patient deleted successfully', null);
};
