import UserModel from '../auth/User.model';
import AppointmentModel from '../appointment/Appointment.model';
import BillModel from '../billing/Bill.model';
import ConsultationModel from '../appointment/Consultation.model';
import AIPredictionModel from '../ai/AIPrediction.model';
import MedicalDocumentModel from '../lab/MedicalDocument.model';
import MedicineModel from '../pharmacy/Medicine.model';

export async function getAdminAnalyticsData() {
  // 1. Core counters
  const totalUsers = await UserModel.countDocuments({ isDeleted: { $ne: true } }).exec();
  const totalAppointments = await AppointmentModel.countDocuments().exec();
  const totalPredictions = await AIPredictionModel.countDocuments().exec();
  const totalReports = await MedicalDocumentModel.countDocuments().exec();

  // 2. Revenue aggregation
  const revenueAgg = await BillModel.aggregate([
    { $match: { status: 'PAID' } },
    { $group: { _id: null, total: { $sum: '$totalAmount' } } }
  ]).exec();
  const totalRevenue = revenueAgg[0]?.total || 0;

  // 3. Appointment status breakdown
  const statusBreakdown = await AppointmentModel.aggregate([
    { $group: { _id: '$status', count: { $sum: 1 } } }
  ]).exec();
  const statusCounts = statusBreakdown.reduce((acc: any, curr: any) => {
    acc[curr._id] = curr.count;
    return acc;
  }, {});

  // 4. Monthly revenue trends
  const monthlyRevenue = await BillModel.aggregate([
    { $match: { status: 'PAID' } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
        revenue: { $sum: '$totalAmount' }
      }
    },
    { $sort: { _id: 1 } }
  ]).exec();

  const revenueTimeline = monthlyRevenue.map((m: any) => ({
    period: m._id,
    revenue: m.revenue
  }));

  // 5. Daily appointments trends (last 30 days)
  const dailyAppts = await AppointmentModel.aggregate([
    {
      $match: {
        createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
      }
    },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]).exec();

  const dailyTimeline = dailyAppts.map((d: any) => ({
    date: d._id,
    count: d.count
  }));

  // 6. AI prediction outcomes breakdown
  const aiStats = await AIPredictionModel.aggregate([
    { $group: { _id: '$status', count: { $sum: 1 } } }
  ]).exec();
  const aiStatusCounts = aiStats.reduce((acc: any, curr: any) => {
    acc[curr._id] = curr.count;
    return acc;
  }, {});

  // 7. Average session duration
  const sessionDurationAgg = await ConsultationModel.aggregate([
    { $group: { _id: null, avgDuration: { $avg: '$durationSeconds' } } }
  ]).exec();
  const avgSessionDuration = Math.round(sessionDurationAgg[0]?.avgDuration || 0);

  // 8. Pharmacy valuations
  const pharmacyValAgg = await MedicineModel.aggregate([
    { $match: { isDeleted: { $ne: true } } },
    { $group: { _id: null, totalVal: { $sum: { $multiply: ['$price', '$quantity'] } } } }
  ]).exec();
  const totalInventoryValue = pharmacyValAgg[0]?.totalVal || 0;

  return {
    kpis: {
      totalUsers,
      totalAppointments,
      totalRevenue,
      totalPredictions,
      totalReports,
      totalInventoryValue,
      avgSessionDuration
    },
    statusCounts,
    revenueTimeline,
    dailyTimeline,
    aiStatusCounts
  };
}
