import { Router } from 'express';
import { authRouter } from './auth.route';
import { sampleRouter } from './sample.route';
import { userRouter } from './user.route';

const commonRouter = Router();

commonRouter.use('/auth', authRouter);
commonRouter.use('/samples', sampleRouter);
commonRouter.use('/users', userRouter);
export { commonRouter };
