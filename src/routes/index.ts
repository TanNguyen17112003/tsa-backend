import { Router } from 'express';
import authRouter from './auth.route';
import sampleRouter from './sample.route';

const router = Router();

router.use('/auth', authRouter);
router.use('/samples', sampleRouter);

export default router;
