import { Router } from 'express';
import { getLogin } from './controllers';

const router = Router();

router.get('/login', getLogin);

export default router;
