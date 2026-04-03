/**
 * @swagger
 * tags:
 *   name: Records
 *   description: Financial records management
 */

import { Router } from 'express';
import { create, getAll, getOne, update, remove } from '../controllers/record.controller';
import { authenticateToken, authorizeRoles, validate } from '../middlewares';
import { PERMISSIONS } from '../constants/permissions';
import { createRecordSchema, updateRecordSchema } from '../validators/record.validator';

const router = Router();

router.use(authenticateToken);

/**
 * @swagger
 * /records:
 *   post:
 *     summary: Create a record
 *     tags: [Records]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               amount:
 *                 type: number
 *               type:
 *                 type: string
 *               category:
 *                 type: string
 *               date:
 *                 type: string
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Created
 *       400:
 *         description: Validation error
 */
router.post('/', authorizeRoles(...PERMISSIONS.CREATE_RECORD), validate(createRecordSchema), create);

/**
 * @swagger
 * /records:
 *   get:
 *     summary: Get all records
 *     tags: [Records]
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *       - in: query
 *         name: dateFrom
 *         schema:
 *           type: string
 *       - in: query
 *         name: dateTo
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: OK
 */
router.get('/', authorizeRoles(...PERMISSIONS.READ_RECORDS), getAll);

/**
 * @swagger
 * /records/{id}:
 *   get:
 *     summary: Get a single record
 *     tags: [Records]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: OK
 *       404:
 *         description: Not found
 */
router.get('/:id', authorizeRoles(...PERMISSIONS.READ_RECORDS), getOne);

/**
 * @swagger
 * /records/{id}:
 *   patch:
 *     summary: Update a record
 *     tags: [Records]
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
 *     responses:
 *       200:
 *         description: OK
 *       400:
 *         description: Validation error
 */
router.patch('/:id', authorizeRoles(...PERMISSIONS.UPDATE_RECORD), validate(updateRecordSchema), update);

/**
 * @swagger
 * /records/{id}:
 *   delete:
 *     summary: Soft delete a record
 *     tags: [Records]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: OK
 */
router.delete('/:id', authorizeRoles(...PERMISSIONS.DELETE_RECORD), remove);

export default router;
