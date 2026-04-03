import { Router } from 'express';
import { create, getAll, getOne, update, remove } from '../controllers/record.controller';
import { authenticateToken, authorizeRoles, validate } from '../middlewares';
import { PERMISSIONS } from '../constants/permissions';
import { createRecordSchema, updateRecordSchema } from '../validators/record.validator';

const router = Router();

router.use(authenticateToken);

router.post('/', authorizeRoles(...PERMISSIONS.CREATE_RECORD), validate(createRecordSchema), create);
router.get('/', authorizeRoles(...PERMISSIONS.READ_RECORDS), getAll);
router.get('/:id', authorizeRoles(...PERMISSIONS.READ_RECORDS), getOne);
router.patch('/:id', authorizeRoles(...PERMISSIONS.UPDATE_RECORD), validate(updateRecordSchema), update);
router.delete('/:id', authorizeRoles(...PERMISSIONS.DELETE_RECORD), remove);

export default router;
