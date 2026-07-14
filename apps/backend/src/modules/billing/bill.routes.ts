import { Router } from 'express';
import BillController from './bill.controller';
import { protect } from '../../middleware/auth.middleware';

const router = Router();
const controller = new BillController();

// 1. Stripe Webhook Listener (Public Endpoint)
router.post('/webhook', controller.stripeWebhook);

// 2. Protected Routes (Requires JWT Authentication)
router.use(protect);

router.get('/', controller.getBills);
router.get('/:id', controller.getBillById);
router.post('/:id/payment-intent', controller.createPaymentIntent);

export default router;
