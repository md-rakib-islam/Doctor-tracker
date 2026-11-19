import type { RequestHandler } from 'express';
import * as dashboardService from '../services/dashboard.service';
import { sendSuccess } from '../utils/response';

export const overview: RequestHandler = async (req, res) => {
  sendSuccess(res, 'Dashboard overview retrieved successfully', await dashboardService.getOverview(req.validatedQuery.days));
};

export const patientsPerDoctor: RequestHandler = async (req, res) => {
  sendSuccess(
    res,
    'Patients per doctor retrieved successfully',
    await dashboardService.getPatientsPerDoctor(req.validatedQuery),
  );
};

export const statistics: RequestHandler = async (req, res) => {
  sendSuccess(res, 'Dashboard statistics retrieved successfully', await dashboardService.getStatistics(req.validatedQuery));
};
