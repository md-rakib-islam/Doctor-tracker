import { Router } from 'express';
import * as ctrl from '../controllers/auth.controller';
import { authenticate } from '../middleware/authenticate';
import { loginLimiter } from '../middleware/rateLimit';
import { validate } from '../middleware/validate';
import { loginSchema } from '../validators/auth.validators';

const router = Router();

router.post('/login', loginLimiter, validate({ body: loginSchema }), ctrl.login);
router.post('/logout', ctrl.logout);
router.get('/me', authenticate, ctrl.me);

export default router;
