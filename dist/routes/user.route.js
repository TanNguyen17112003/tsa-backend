"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userRouter = void 0;
const express_1 = require("express");
const user_controller_1 = require("../controllers/api/user.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const userRouter = (0, express_1.Router)();
exports.userRouter = userRouter;
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
userRouter.get('', user_controller_1.getUsers);
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
userRouter.get('/:id', auth_middleware_1.authMiddleware, user_controller_1.getUser);
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
userRouter.put('/:id', auth_middleware_1.authMiddleware, user_controller_1.updateUser);
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
userRouter.delete('/:id', auth_middleware_1.authMiddleware, user_controller_1.deleteUser);
//# sourceMappingURL=user.route.js.map