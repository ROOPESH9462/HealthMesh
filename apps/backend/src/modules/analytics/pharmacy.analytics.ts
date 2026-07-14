import MedicineModel from '../pharmacy/Medicine.model';

export async function getPharmacyAnalyticsData() {
  const now = new Date();

  // 1. Medicines below threshold (low stock)
  const lowStockCount = await MedicineModel.countDocuments({
    isDeleted: { $ne: true },
    quantity: { $lt: 15 }
  }).exec();

  // 2. Valuation of stock
  const valuationAgg = await MedicineModel.aggregate([
    { $match: { isDeleted: { $ne: true } } },
    { $group: { _id: null, totalVal: { $sum: { $multiply: ['$price', '$quantity'] } } } }
  ]).exec();
  const totalValuation = valuationAgg[0]?.totalVal || 0;

  // 3. Expired medicines count
  const expiredCount = await MedicineModel.countDocuments({
    isDeleted: { $ne: true },
    expiryDate: { $lt: now }
  }).exec();

  // 4. Medicines categories distribution
  const categoriesAgg = await MedicineModel.aggregate([
    { $match: { isDeleted: { $ne: true } } },
    { $group: { _id: '$category', count: { $sum: '$quantity' } } },
    { $sort: { count: -1 } }
  ]).exec();

  const categoriesDistribution = categoriesAgg.map((c: any) => ({
    name: c._id || 'General',
    count: c.count
  }));

  // 5. Total unique medicines in catalog
  const uniqueMedicinesCount = await MedicineModel.countDocuments({ isDeleted: { $ne: true } }).exec();

  return {
    kpis: {
      lowStockCount,
      totalValuation,
      expiredCount,
      uniqueMedicinesCount
    },
    categoriesDistribution
  };
}
