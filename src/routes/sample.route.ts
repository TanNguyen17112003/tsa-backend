import express from 'express';
import { getSamples, getSample, createSample, updateSample, deleteSample } from '../controllers/sample.controller';

const modelRouter = express.Router();

/**
 * @openapi
 * /api/models:
 *   get:
 *     tags:
 *     - Sample
 *     summary: Get all models
 *     responses:
 *       200:
 *         description: Success
 */
modelRouter.get('', getSamples);

/**
 * @openapi
 * /api/models/{id}:
 *   get:
 *     tags:
 *     - Sample
 *     summary: Get model by ID
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
modelRouter.get('/:id', getSample);

/**
 * @openapi
 * /api/models:
 *   post:
 *     tags:
 *     - Sample
 *     summary: Create a new model
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
modelRouter.post('', createSample);

/**
 * @openapi
 * /api/models/{id}:
 *   put:
 *     tags:
 *     - Sample
 *     summary: Update a model
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
modelRouter.put('/:id', updateSample);

/**
 * @openapi
 * /api/models/{id}:
 *   delete:
 *     tags:
 *     - Sample
 *     summary: Delete a model
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
modelRouter.delete('/:id', deleteSample);

export default modelRouter;
