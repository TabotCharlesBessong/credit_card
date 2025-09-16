import { Router } from 'express';
import * as cardController from '../controllers/cardController';
import { authenticateToken } from '../middleware/auth'; // Assuming you'll have auth middleware

const router = Router();

// All card routes will be protected by authentication middleware
router.use(authenticateToken);

router.post('/', cardController.createCreditCard);
router.get('/', cardController.getAllCreditCards);
router.get('/:id', cardController.getCreditCardById);
router.put('/:id/block', cardController.blockCreditCard);

export default router;
