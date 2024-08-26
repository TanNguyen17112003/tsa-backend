import express from 'express';
import {
  getSamples,
  getSample,
  createSample,
  updateSample,
  deleteSample
} from '../controllers/api/sample.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const sampleRouter = express.Router();

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
sampleRouter.get('', authMiddleware, getSamples);

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
sampleRouter.get('/:id', authMiddleware, getSample);

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
sampleRouter.post('', authMiddleware, createSample);

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
sampleRouter.put('/:id', authMiddleware, updateSample);

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
sampleRouter.delete('/:id', authMiddleware, deleteSample);

export { sampleRouter };
