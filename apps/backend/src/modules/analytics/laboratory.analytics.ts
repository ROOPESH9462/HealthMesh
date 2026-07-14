import MedicalDocumentModel from '../lab/MedicalDocument.model';

export async function getLabAnalyticsData() {
  // 1. Total uploaded reports
  const totalReports = await MedicalDocumentModel.countDocuments().exec();

  // 2. Verified reports count
  const verifiedReports = await MedicalDocumentModel.countDocuments({
    isVerifiedByDoctor: true
  }).exec();

  // 3. Pending verification reports count
  const pendingVerification = await MedicalDocumentModel.countDocuments({
    isVerifiedByDoctor: false
  }).exec();

  // 4. Report category distribution
  const categoriesAgg = await MedicalDocumentModel.aggregate([
    { $group: { _id: '$documentType', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]).exec();

  const categoriesDistribution = categoriesAgg.map((c: any) => ({
    name: c._id || 'Unclassified',
    count: c.count
  }));

  // 5. Total reports uploaded by patient (self uploaded) vs staff
  const selfUploadedCount = await MedicalDocumentModel.countDocuments({
    doctorId: { $exists: false }
  }).exec();

  return {
    kpis: {
      totalReports,
      verifiedReports,
      pendingVerification,
      selfUploadedCount
    },
    categoriesDistribution
  };
}
