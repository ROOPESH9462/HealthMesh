import { Request, Response, NextFunction } from 'express';
import BillService from './bill.service';
import stripe from '../../config/stripe';
import { formatSuccessResponse } from '@healthcare/shared-utils';
import { mapBillToDTO } from '@healthcare/api-contracts';
import logger from '../../utils/logger';

export class BillController {
  private billService = new BillService();

  getBills = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = (req as any).user;
      const page = parseInt(req.query.page as string, 10) || 1;
      const limit = parseInt(req.query.limit as string, 10) || 10;
      const status = req.query.status as string;
      const patientId = req.query.patientId as string;

      const { data, pagination } = await this.billService.getBills({
        userId: user.id,
        role: user.role,
        page,
        limit,
        status,
        patientId,
      });

      const mapped = data.map((bill: any) => mapBillToDTO(bill));
      res.status(200).json(formatSuccessResponse('Bills list retrieved successfully', mapped, pagination));
    } catch (error) {
      next(error);
    }
  };

  getBillById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const user = (req as any).user;

      const bill = await this.billService.getBillById(id, user.id, user.role);
      const dto = mapBillToDTO(bill as any);

      res.status(200).json(formatSuccessResponse('Bill details retrieved successfully', dto));
    } catch (error) {
      next(error);
    }
  };

  createPaymentIntent = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const paymentIntent = await this.billService.createPaymentIntent(id);
      res.status(200).json(formatSuccessResponse('Stripe PaymentIntent generated', paymentIntent));
    } catch (error) {
      next(error);
    }
  };

  /**
   * Listen to Stripe callbacks to confirm payment outcomes
   */
  stripeWebhook = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const signature = req.headers['stripe-signature'] as string;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event: any;

    try {
      if (webhookSecret && signature) {
        // Construct verified Stripe event
        event = stripe.webhooks.constructEvent((req as any).rawBody || JSON.stringify(req.body), signature, webhookSecret);
      } else {
        // Dev fallback bypass
        logger.info('Bypassing Stripe signature verification. Event parsed directly from body.');
        event = req.body;
      }
    } catch (err: any) {
      logger.error('Stripe webhook verification failed', err);
      res.status(400).send(`Webhook Error: ${err.message}`);
      return;
    }

    try {
      // Process successful payment outcomes
      if (event.type === 'payment_intent.succeeded') {
        const paymentIntent = event.data.object;
        await this.billService.confirmPayment(paymentIntent.id);
      }
      res.status(200).json({ received: true });
    } catch (error) {
      next(error);
    }
  };
}
export default BillController;
