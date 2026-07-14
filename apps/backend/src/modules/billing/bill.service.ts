import BillRepository from './bill.repository';
import stripe from '../../config/stripe';
import { NotFoundError, BadRequestError } from '@healthcare/shared-utils';
import { PaymentStatus, UserRole } from '@healthcare/shared-types';
import { ClientSession } from 'mongoose';
import logger from '../../utils/logger';

export class BillService {
  private billRepo = new BillRepository();

  /**
   * Generates a new invoice bill inside a transaction session
   */
  async createBill(
    params: {
      patientId: string;
      appointmentId?: string;
      prescriptionId?: string;
      items: Array<{ description: string; amount: number }>;
      insuranceCoveredAmount?: number;
    },
    session?: ClientSession
  ) {
    const consultationSum = params.items.reduce((sum, item) => sum + item.amount, 0);
    const taxRate = 0.18; // 18% GST standard healthcare tax simulation
    const taxAmount = Math.round(consultationSum * taxRate * 100) / 100;
    const totalAmount = consultationSum + taxAmount;
    
    const insuranceCovered = params.insuranceCoveredAmount || 0;
    const netPayable = Math.max(0, totalAmount - insuranceCovered);

    const bill = await this.billRepo.createBill(
      {
        patientId: params.patientId,
        appointmentId: params.appointmentId,
        prescriptionId: params.prescriptionId,
        items: params.items,
        taxAmount,
        totalAmount,
        insuranceCoveredAmount: insuranceCovered,
        netPayableAmount: netPayable,
        status: PaymentStatus.PENDING,
      },
      session
    );

    return bill;
  }

  /**
   * Initiate Stripe payment session / PaymentIntent creation
   */
  async createPaymentIntent(billId: string) {
    const bill = await this.billRepo.findBillById(billId);
    if (!bill) {
      throw new NotFoundError('Invoice bill not found');
    }

    if (bill.status === PaymentStatus.COMPLETED) {
      throw new BadRequestError('Invoice bill has already been paid');
    }

    const payableCents = Math.round(bill.netPayableAmount * 100);

    let clientSecret = 'mock_secret_key';
    let paymentIntentId = 'mock_intent_id_' + Date.now();

    const isStripeActive = !!process.env.STRIPE_SECRET_KEY;

    if (isStripeActive && payableCents > 0) {
      try {
        const intent = await stripe.paymentIntents.create({
          amount: payableCents,
          currency: 'inr',
          metadata: { billId: bill.id, patientId: bill.patientId.toString() }
        });
        clientSecret = intent.client_secret || '';
        paymentIntentId = intent.id;
      } catch (err: any) {
        logger.error('Stripe PaymentIntent creation failed', err);
        throw new BadRequestError('Stripe API error: ' + err.message);
      }
    } else {
      logger.info('Stripe inactive. Generating mock checkout secrets for local testing.');
    }

    // Log the pending transaction payment record
    await this.billRepo.createPayment({
      billId: bill.id,
      amount: bill.netPayableAmount,
      paymentMethod: 'STRIPE',
      stripePaymentIntentId: paymentIntentId,
      status: PaymentStatus.PENDING,
    });

    return {
      clientSecret,
      paymentIntentId,
      netPayableAmount: bill.netPayableAmount,
    };
  }

  /**
   * Finalize/confirm payment logs and transition bill status to PAID
   */
  async confirmPayment(paymentIntentId: string, session?: ClientSession) {
    const isStripeActive = !!process.env.STRIPE_SECRET_KEY;

    if (isStripeActive) {
      try {
        const intent = await stripe.paymentIntents.retrieve(paymentIntentId);
        if (intent.status !== 'succeeded') {
          throw new BadRequestError(`Stripe Payment Intent status is ${intent.status}`);
        }
      } catch (err: any) {
        logger.error('Failed to confirm status from Stripe gateway', err);
        throw new BadRequestError('Stripe retrieve error: ' + err.message);
      }
    }

    // Find payment record
    const { data: payments } = await this.billRepo.listPayments({ stripePaymentIntentId: paymentIntentId }, { page: 1, limit: 1 });
    if (payments.length === 0) {
      throw new NotFoundError('Logged transaction not found matching paymentIntent ID');
    }

    const paymentLog = payments[0];
    if (paymentLog.status === PaymentStatus.COMPLETED) {
      return this.billRepo.findBillById(paymentLog.billId.id);
    }

    // Update payment record to COMPLETED
    paymentLog.status = PaymentStatus.COMPLETED;
    
    // Update invoice status to COMPLETED
    const bill = await this.billRepo.updateBillStatus(paymentLog.billId.id, PaymentStatus.COMPLETED, session);
    
    // If it's a Mongoose doc, we save it. Since it was retrieved as JSON from repository,
    // we call the repository to save updates or we can update directly.
    // Let's create a direct update query for Payment document status update.
    // We will do it inside the repository or direct Model find.
    // Let's import PaymentModel inside our service or just write update logic.
    // To keep it clean, we can import PaymentModel directly.
    const PaymentModel = require('./Payment.model').default;
    await PaymentModel.findByIdAndUpdate(paymentLog.id, { status: PaymentStatus.COMPLETED }, { session }).exec();

    logger.info(`Bill ${paymentLog.billId.id} successfully finalized via checkout ID ${paymentIntentId}`);
    return bill;
  }

  /**
   * List invoice bills under patient bounds or receptionist ledger
   */
  async getBills(params: {
    userId: string;
    role: string;
    page: number;
    limit: number;
    status?: string;
    patientId?: string;
  }) {
    const filter: Record<string, any> = {};

    if (params.status) {
      filter.status = params.status;
    }

    if (params.role === UserRole.PATIENT) {
      const PatientModel = require('../patient/Patient.model').default;
      const patient = await PatientModel.findOne({ userId: params.userId }).exec();
      if (!patient) {
        throw new NotFoundError('Patient profile not found.');
      }
      filter.patientId = patient._id;
    } else if (params.patientId) {
      filter.patientId = params.patientId;
    }

    return this.billRepo.listBills(filter, { page: params.page, limit: params.limit });
  }

  /**
   * Retrieve single bill, verifying ownership details
   */
  async getBillById(id: string, userId: string, role: string) {
    const bill = await this.billRepo.findBillById(id);
    if (!bill) {
      throw new NotFoundError('Bill invoice not found');
    }

    if (role === UserRole.PATIENT) {
      const PatientModel = require('../patient/Patient.model').default;
      const patient = await PatientModel.findOne({ userId }).exec();
      if (!patient || bill.patientId.toString() !== patient._id.toString()) {
        throw new BadRequestError('Unauthorized access to this billing invoice');
      }
    }

    return bill;
  }
}
export default BillService;
