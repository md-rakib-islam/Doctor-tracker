import { Router } from 'express';
import * as ctrl from '../controllers/doctor.controller';
import { validate } from '../middleware/validate';
import { idParams } from '../validators/common';
import {
  createDoctorSchema,
  deleteDoctorQuery,
  listDoctorsQuery,
  updateDoctorSchema,
} from '../validators/doctor.validators';
import { createDoctorPatientSchema, listPatientsQuery } from '../validators/patient.validators';

const router = Router();

// Static paths first so they are not captured by `/:id`.
router.get('/filters', ctrl.filterOptions);
router.get('/options', ctrl.options);

router.get('/', validate({ query: listDoctorsQuery }), ctrl.list);
router.post('/', validate({ body: createDoctorSchema }), ctrl.create);
router.get('/:id', validate({ params: idParams }), ctrl.getOne);
router.patch('/:id', validate({ params: idParams, body: updateDoctorSchema }), ctrl.update);
router.delete('/:id', validate({ params: idParams, query: deleteDoctorQuery }), ctrl.remove);

router.get('/:id/patients', validate({ params: idParams, query: listPatientsQuery }), ctrl.listPatients);
router.post('/:id/patients', validate({ params: idParams, body: createDoctorPatientSchema }), ctrl.addPatient);

export default router;
