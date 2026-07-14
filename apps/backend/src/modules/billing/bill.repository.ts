import BillModel, { IBillDocument } from './Bill.model';
import PaymentModel, { IPaymentDocument } from './Payment.model';
import { IPaginationMeta } from '@healthcare/shared-utils';
import { ClientSession } from 'mongoose';

export class BillRepository {
  /**
   * Create a new Bill invoice inside a transaction
   */
  async createBill(data: any, session?: ClientSession): Promise<IBillDocument> {
    const docs = await BillModel.create([data], { session });
    return docs[0];
  }

  /**
   * Find Bill by ID
   */
  async findBillById(id: string): Promise<IBillDocument | null> {
    return BillModel.findById(id)
      .populate('appointmentId', 'date timeSlot status')
      .populate('prescriptionId', 'medicines instructions issuedDate isFilled')
      .populate({
        path: 'patientId',
        select: 'userId dateOfBirth gender',
        populate: { path: 'userId', select: 'firstName lastName email phoneNumber' }
      })
      .exec();
  }

  /**
   * Find Bill by Appointment ID
   */
  async findBillByAppointmentId(appointmentId: string): Promise<IBillDocument | null> {
    return BillModel.findOne({ appointmentId }).exec();
  }

  /**
   * List invoice bills
   */
  async listBills(
    filter: Record<string, any> = {},
    pagination: { page: number; limit: number }
  ): Promise<{ data: any[]; pagination: IPaginationMeta }> {
    const { page, limit } = pagination;
    const skip = (page - 1) * limit;

    const mongoFilter = { ...filter };

    const total = await BillModel.countDocuments(mongoFilter).exec();
    const pages = Math.ceil(total / limit) || 1;

    const results = await BillModel.find(mongoFilter)
      .skip(skip)
      .limit(limit)
      .populate('appointmentId', 'date timeSlot status')
      .populate({
        path: 'patientId',
        select: 'userId dateOfBirth gender',
        populate: { path: 'userId', select: 'firstName lastName email' }
      })
      .sort({ createdAt: -1 })
      .exec();

    const data = results.map((doc) => doc.toJSON());

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        pages,
      },
    };
  }

  /**
   * Update billing payment status
   */
  async updateBillStatus(
    id: string,
    status: string,
    session?: ClientSession
  ): Promise<IBillDocument | null> {
    return BillModel.findByIdAndUpdate(id, { status }, { new: true, session }).exec();
  }

  /**
   * Record payment transaction details
   */
  async createPayment(data: any, session?: ClientSession): Promise<IPaymentDocument> {
    const docs = await PaymentModel.create([data], { session });
    return docs[0];
  }

  /**
   * List logged payment transactions
   */
  async listPayments(
    filter: Record<string, any> = {},
    pagination: { page: number; limit: number }
  ): Promise<{ data: any[]; pagination: IPaginationMeta }> {
    const { page, limit } = pagination;
    const skip = (page - 1) * limit;

    const total = await PaymentModel.countDocuments(filter).exec();
    const pages = Math.ceil(total / limit) || 1;

    const results = await PaymentModel.find(filter)
      .skip(skip)
      .limit(limit)
      .populate({
        path: 'billId',
        populate: {
          path: 'patientId',
          populate: { path: 'userId', select: 'firstName lastName email' }
        }
      })
      .sort({ createdAt: -1 })
      .exec();

    const data = results.map((doc) => doc.toJSON());

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        pages,
      },
    };
  }
}
export default BillRepository;
