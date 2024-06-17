import { Router } from 'express';
import {
  register,
  login,
  changeInformation,
  resetPassword,
  sendOtp,
  verifyOTP
} from '@controllers';
import { authMiddleware, authAutoLog } from '@middlewares';

const authRouter = Router();

/**
 * @openapi
 * /api/auth/register:
 *   post:
 *     tags:
 *     - Auth
 *     summary: Register a new user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - firstName
 *               - lastName
 *               - password
 *               - role
 *             properties:
 *               email:
 *                 type: string
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               password:
 *                 type: string
 *               role:
 *                 type: string
 *     responses:
 *       201:
 *         description: User created successfully
 *       400:
 *         description: User already exists
 */
authRouter.post('/register', authAutoLog, register);

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     tags:
 *     - Auth
 *     summary: Login a user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: User logged in successfully
 *       400:
 *         description: Invalid credentials
 */
authRouter.post('/login', authAutoLog, login);

/**
 * @openapi
 * /api/auth/change-information/{id}:
 *   put:
 *     tags:
 *     - Auth
 *     summary: Change user information
 *     parameters:
 *     - in: path
 *       name: id
 *       required: true
 *       schema:
 *         type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - firstName
 *               - lastName
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *     responses:
 *       200:
 *         description: User updated successfully
 *       400:
 *         description: User not found
 */

authRouter.put('/change-information/:id', authMiddleware, authAutoLog, changeInformation);

/**
 * @openapi
 * /api/auth/reset-password:
 *   put:
 *     tags:
 *     - Auth
 *     summary: Reset user password
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - newPassword
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password updated successfully
 *       400:
 *         description: Invalid credentials
 */
authRouter.put('/reset-password', authMiddleware, authAutoLog, resetPassword);

/**
 * @openapi
 * /api/auth/send-otp/{id}:
 *   post:
 *     tags:
 *     - Auth
 *     summary: Send OTP to user
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: OTP sent successfully
 *       400:
 *         description: Invalid email
 */
authRouter.post('/send-otp/:id', authMiddleware, authAutoLog, sendOtp);

/**
 * @openapi
 * /api/auth/verify-otp/{id}:
 *   post:
 *     tags:
 *     - Auth
 *     summary: Verify OTP
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - otp
 *             properties:
 *               otp:
 *                 type: string
 *     responses:
 *       200:
 *         description: OTP verified successfully
 *       400:
 *         description: Invalid OTP
 */
authRouter.post('/verify-otp/:id', authMiddleware, authAutoLog, verifyOTP);

export { authRouter };
