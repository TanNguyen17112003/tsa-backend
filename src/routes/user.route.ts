import { Router } from 'express';
import { getUsers, getUser, updateUser, deleteUser } from '../controllers/api/user.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const userRouter = Router();

/**
 * @swagger
 *  /api/users:
 *    get:
 *      tags:
 *      - User
 *      summary: Get all users
 *      responses:
 *        200:
 *          description: A list of users
 */
userRouter.get('', getUsers);

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     tags:
 *     - User
 *     summary: Get a user by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: User ID
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: A user object
 */
userRouter.get('/:id', authMiddleware, getUser);

/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     tags:
 *     - User
 *     summary: Update a user by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: User ID
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               role:
 *                 type: string
 *     responses:
 *       200:
 *         description: User updated successfully
 */
userRouter.put('/:id', authMiddleware, updateUser);

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     tags:
 *     - User
 *     summary: Delete a user by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: User ID
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User deleted successfully
 */
userRouter.delete('/:id', authMiddleware, deleteUser);

export { userRouter };
