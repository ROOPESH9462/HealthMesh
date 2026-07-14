import DoctorModel from '../doctor/Doctor.model';
import AppointmentModel from '../appointment/Appointment.model';
import ConsultationModel from '../appointment/Consultation.model';
import PrescriptionModel from '../appointment/Prescription.model';
import { NotFoundError } from '@healthcare/shared-utils';

export async function getDoctorAnalyticsData(doctorUserId: string) {
  const doctor = await DoctorModel.findOne({ userId: doctorUserId }).exec();
  if (!doctor) {
    throw new NotFoundError('Doctor profile not found');
  }

  const doctorId = doctor._id.toString();

  // 1. Today's appointments count
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);

  const todaysAppointmentsCount = await AppointmentModel.countDocuments({
    doctorId,
    date: { $gte: startOfToday, $lte: endOfToday }
  }).exec();

  // 2. Upcoming appointments count
  const upcomingAppointmentsCount = await AppointmentModel.countDocuments({
    doctorId,
    status: { $in: ['SCHEDULED', 'CONFIRMED'] },
    date: { $gt: endOfToday }
  }).exec();

  // 3. Completed consultations
  const completedConsultationsCount = await AppointmentModel.countDocuments({
    doctorId,
    status: 'COMPLETED'
  }).exec();

  // 4. Average consultation duration
  const durationAgg = await ConsultationModel.aggregate([
    { $match: { doctorId: doctor._id } },
    { $group: { _id: null, avgDuration: { $avg: '$durationSeconds' } } }
  ]).exec();
  const avgDuration = Math.round(durationAgg[0]?.avgDuration || 0);

  // 5. Total prescriptions written
  const prescriptionsCount = await PrescriptionModel.countDocuments({ doctorId }).exec();

  // 6. Top prescribed medications (distribution)
  const topMeds = await PrescriptionModel.aggregate([
    { $match: { doctorId: doctor._id } },
    { $unwind: '$medicines' },
    { $group: { _id: '$medicines.medicineName', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 5 }
  ]).exec();

  const medicationDistribution = topMeds.map((m: any) => ({
    name: m._id,
    count: m.count
  }));

  // 7. Weekly consultation volumes (last 7 days)
  const startOfSevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const dailyVolumes = await AppointmentModel.aggregate([
    {
      $match: {
        doctorId: doctor._id,
        status: 'COMPLETED',
        createdAt: { $gte: startOfSevenDaysAgo }
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

  const dailyVolumesTimeline = dailyVolumes.map((d: any) => ({
    date: d._id,
    count: d.count
  }));

  return {
    kpis: {
      todaysAppointmentsCount,
      upcomingAppointmentsCount,
      completedConsultationsCount,
      avgDuration,
      prescriptionsCount
    },
    medicationDistribution,
    dailyVolumesTimeline
  };
}
