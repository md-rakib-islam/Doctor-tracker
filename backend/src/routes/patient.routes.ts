import { Router } from 'express';
import * as ctrl from '../controllers/patient.controller';
import { validate } from '../middleware/validate';
import { idParams } from '../validators/common';
import { createPatientSchema, listPatientsQuery, updatePatientSchema } from '../validators/patient.validators';

const router = Router();

router.get('/', validate({ query: listPatientsQuery }), ctrl.list);
router.post('/', validate({ body: createPatientSchema }), ctrl.create);
router.get('/:id', validate({ params: idParams }), ctrl.getOne);
router.patch('/:id', validate({ params: idParams, body: updatePatientSchema }), ctrl.update);
router.delete('/:id', validate({ params: idParams }), ctrl.remove);

export default router;
