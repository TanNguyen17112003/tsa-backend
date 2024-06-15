import express from 'express';
import { getSamples, getSample, createSample, updateSample, deleteSample } from '../controllers/sample.controller';

const sampleRouter = express.Router();

/**
 * @openapi
 * /api/samples:
 *   get:
 *     tags:
 *     - Sample
 *     summary: Get all samples
 *     responses:
 *       200:
 *         description: Success
 */
sampleRouter.get('', getSamples);

/**
 * @openapi
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
sampleRouter.get('/:id', getSample);

/**
 * @openapi
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
sampleRouter.post('', createSample);

/**
 * @openapi
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
sampleRouter.put('/:id', updateSample);

/**
 * @openapi
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
sampleRouter.delete('/:id', deleteSample);

export default sampleRouter;
