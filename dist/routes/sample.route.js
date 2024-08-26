"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sampleRouter = void 0;
const express_1 = __importDefault(require("express"));
const sample_controller_1 = require("../controllers/api/sample.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const sampleRouter = express_1.default.Router();
exports.sampleRouter = sampleRouter;
/**
 * @swagger
 * /api/samples:
 *   get:
 *     tags:
 *     - Sample
 *     summary: Get all samples
 *     responses:
 *       200:
 *         description: Success
 */
sampleRouter.get('', auth_middleware_1.authMiddleware, sample_controller_1.getSamples);
/**
 * @swagger
 * /api/samples/{id}:
 *   get:
 *     tags:
 *     - Sample
 *     summary: Get sample by ID
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 *       404:
 *         description: Sample not found
 */
sampleRouter.get('/:id', auth_middleware_1.authMiddleware, sample_controller_1.getSample);
/**
 * @swagger
 * /api/samples:
 *   post:
 *     tags:
 *     - Sample
 *     summary: Create a new sample
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               version:
 *                 type: number
 *               status:
 *                 type: string
 *               type:
 *                 type: string
 *                 format: objectId
 *     responses:
 *       201:
 *         description: Created
 */
sampleRouter.post('', auth_middleware_1.authMiddleware, sample_controller_1.createSample);
/**
 * @swagger
 * /api/samples/{id}:
 *   put:
 *     tags:
 *     - Sample
 *     summary: Update a sample
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               version:
 *                 type: number
 *               status:
 *                 type: string
 *               type:
 *                 type: string
 *                 format: objectId
 *     responses:
 *       200:
 *         description: Updated
 *       404:
 *         description: Sample not found
 */
sampleRouter.put('/:id', auth_middleware_1.authMiddleware, sample_controller_1.updateSample);
/**
 * @swagger
 * /api/samples/{id}:
 *   delete:
 *     tags:
 *     - Sample
 *     summary: Delete a sample
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Deleted
 *       404:
 *         description: Sample not found
 */
sampleRouter.delete('/:id', auth_middleware_1.authMiddleware, sample_controller_1.deleteSample);
//# sourceMappingURL=sample.route.js.map