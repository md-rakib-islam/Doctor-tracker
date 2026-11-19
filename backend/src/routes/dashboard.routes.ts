import { Router } from 'express';
import * as ctrl from '../controllers/dashboard.controller';
import { validate } from '../middleware/validate';
import { overviewQuery, patientsPerDoctorQuery, statisticsQuery } from '../validators/dashboard.validators';

const router = Router();

router.get('/overview', validate({ query: overviewQuery }), ctrl.overview);
router.get('/patients-per-doctor', validate({ query: patientsPerDoctorQuery }), ctrl.patientsPerDoctor);
router.get('/statistics', validate({ query: statisticsQuery }), ctrl.statistics);

export default router;
