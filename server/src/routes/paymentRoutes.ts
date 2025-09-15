import { Router } from 'express';
import * as paymentController from '../controllers/paymentController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);

// Top-up routes
router.post('/topup/mobile-money', paymentController.topUpMobileMoney);
router.post('/topup/orange-money', paymentController.topUpOrangeMoney);
router.post('/topup/bank-account', paymentController.topUpBankAccount);

// Send money routes
router.post('/send/mobile-money', paymentController.sendToMobileMoney);
router.post('/send/orange-money', paymentController.sendToOrangeMoney);
router.post('/send/bank-account', paymentController.sendToBankAccount);

// Card payment route
router.post('/card/charge', paymentController.processCardPayment);

router.get('/credit-cards/:cardId/transactions', paymentController.fetchCardTransactions); // New route

export default router;
