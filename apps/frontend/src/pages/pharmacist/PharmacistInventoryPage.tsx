import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { 
  Plus, 
  Search, 
  AlertTriangle, 
  Warehouse, 
  PackageOpen, 
  DollarSign, 
  Layers,
  Calendar,
  AlertCircle,
  FileCheck2
} from 'lucide-react';
import { formatDate } from '@healthcare/shared-utils';

interface Medicine {
  id: string;
  name: string;
  manufacturer: string;
  composition: string[];
  dosageForm: string;
  strength: string;
  stockCount: number;
  pricePerUnit: number;
  expiryDate: string;
  lowStockThreshold: number;
  barcode?: string;
}

const PharmacistInventoryPage: React.FC = () => {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // Search state
  const [searchTerm, setSearchTerm] = useState('');

  // Modals state
  const [showAddMedicine, setShowAddMedicine] = useState(false);
  const [showReplenish, setShowReplenish] = useState(false);
  const [selectedReplenishMed, setSelectedReplenishMed] = useState<Medicine | null>(null);

  // New medicine form state
  const [name, setName] = useState('');
  const [manufacturer, setManufacturer] = useState('');
  const [composition, setComposition] = useState('');
  const [dosageForm, setDosageForm] = useState('TABLET');
  const [strength, setStrength] = useState('500mg');
  const [pricePerUnit, setPricePerUnit] = useState(5);
  const [expiryDate, setExpiryDate] = useState('');
  const [lowStockThreshold, setLowStockThreshold] = useState(10);
  const [barcode, setBarcode] = useState('');
  const [submittingMed, setSubmittingMed] = useState(false);

  // Intake batch form state
  const [batchNumber, setBatchNumber] = useState('');
  const [batchQty, setBatchQty] = useState(100);
  const [batchLocation, setBatchLocation] = useState('Aisle 1, Shelf A');
  const [supplierName, setSupplierName] = useState('Generic Pharmaceuticals Co');
  const [batchExpiry, setBatchExpiry] = useState('');
  const [submittingBatch, setSubmittingBatch] = useState(false);

  const fetchInventory = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await api.get('/pharmacy', {
        params: { name: searchTerm || undefined }
      });
      setMedicines(res.data.data || []);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to retrieve pharmaceutical inventory.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchInventory();
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchTerm]);

  const handleAddMedicineSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingMed(true);
    try {
      const compositionArray = composition.split(',').map((c) => c.trim()).filter(Boolean);
      await api.post('/pharmacy', {
        name,
        manufacturer,
        composition: compositionArray,
        dosageForm,
        strength,
        pricePerUnit,
        expiryDate,
        lowStockThreshold,
        barcode: barcode || undefined
      });
      
      // Refresh
      fetchInventory();
      setShowAddMedicine(false);
      // Reset
      setName('');
      setManufacturer('');
      setComposition('');
      setExpiryDate('');
      setBarcode('');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to register medicine.');
    } finally {
      setSubmittingMed(false);
    }
  };

  const handleReplenishSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReplenishMed) return;

    setSubmittingBatch(true);
    try {
      await api.post('/pharmacy/batches', {
        medicineId: selectedReplenishMed.id,
        batchNumber,
        quantity: batchQty,
        location: batchLocation,
        supplierName,
        expiryDate: batchExpiry
      });

      // Refresh
      fetchInventory();
      setShowReplenish(false);
      // Reset
      setSelectedReplenishMed(null);
      setBatchNumber('');
      setBatchExpiry('');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to replenish stock batch.');
    } finally {
      setSubmittingBatch(false);
    }
  };

  return (
    <div className="space-y-6 text-slate-100 font-sans">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Warehouse className="w-5 h-5 text-sky-400" />
            Pharmacy Catalog & Stock room
          </h2>
          <p className="text-xs text-slate-400">Add drug profiles, replenish quantities, and monitor low-stock notifications</p>
        </div>
        <button
          onClick={() => setShowAddMedicine(true)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-sky-500 hover:bg-sky-400 rounded-lg shadow-md transition-colors"
        >
          <Plus className="w-4.5 h-4.5" />
          Add Medicine Profile
        </button>
      </div>

      {errorMsg && (
        <div className="flex items-start gap-3 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <div>
            <p className="font-semibold">Stock Ledger Warning</p>
            <p className="text-xs mt-0.5 leading-relaxed">{errorMsg}</p>
          </div>
        </div>
      )}

      {/* Search Filter */}
      <div className="flex items-center p-3 bg-slate-900/40 border border-slate-800 rounded-xl max-w-md">
        <Search className="w-4 h-4 text-slate-450 mr-2 shrink-0" />
        <input
          type="text"
          placeholder="Filter drugs catalog by name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-transparent text-sm text-slate-100 focus:outline-none placeholder-slate-700"
        />
      </div>

      {/* Grid inventory list */}
      {loading ? (
        <div className="text-center py-12 text-slate-550 text-sm">Querying catalog inventory...</div>
      ) : medicines.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 bg-slate-900/10 border border-slate-850 rounded-2xl text-slate-550">
          <Warehouse className="w-12 h-12 text-slate-800 mb-2" />
          <p className="text-sm font-semibold">No medicines registered in matching query</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {medicines.map((med) => {
            const isLowStock = med.stockCount < med.lowStockThreshold;
            return (
              <div key={med.id} className={`p-5 rounded-2xl border transition-all flex flex-col justify-between gap-4 ${
                isLowStock 
                  ? 'bg-amber-500/5 border-amber-500/20 hover:border-amber-500/35' 
                  : 'bg-slate-900/30 border-slate-800 hover:border-slate-700'
              }`}>
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-sm text-white">{med.name}</h4>
                    <p className="text-[10px] text-sky-400 font-semibold">{med.manufacturer} • {med.strength}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                    med.dosageForm === 'TABLET' 
                      ? 'bg-sky-500/10 text-sky-400 border border-sky-500/15' 
                      : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/15'
                  }`}>
                    {med.dosageForm.toLowerCase()}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 p-3 bg-slate-950/60 rounded-xl text-xs font-semibold">
                  <div className="space-y-0.5 text-slate-350">
                    <span className="text-[9px] text-slate-500 uppercase block font-bold">In Stock</span>
                    <span className={`flex items-center gap-1 font-mono text-sm ${isLowStock ? 'text-amber-400 font-bold' : 'text-white'}`}>
                      <Layers className="w-3.5 h-3.5 text-sky-500" />
                      {med.stockCount}
                    </span>
                  </div>
                  <div className="space-y-0.5 text-slate-350">
                    <span className="text-[9px] text-slate-500 uppercase block font-bold">Unit Price</span>
                    <span className="flex items-center font-mono text-sm text-white">
                      <DollarSign className="w-3.5 h-3.5 text-sky-500" />
                      ₹{med.pricePerUnit}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-450 border-t border-slate-900 pt-3">
                  <span className="flex items-center gap-1 font-semibold">
                    <Calendar className="w-3.5 h-3.5" />
                    Exp: {formatDate(med.expiryDate)}
                  </span>
                  
                  {isLowStock && (
                    <span className="flex items-center gap-1 text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/15">
                      <AlertTriangle className="w-3 h-3" />
                      Low Stock
                    </span>
                  )}
                </div>

                <button
                  onClick={() => {
                    setSelectedReplenishMed(med);
                    setShowReplenish(true);
                  }}
                  className="flex items-center justify-center gap-1.5 w-full py-2 text-xs font-bold text-white bg-slate-950 hover:bg-slate-900 border border-slate-850 rounded-lg transition-colors mt-2"
                >
                  <PackageOpen className="w-4 h-4 text-sky-500" />
                  Replenish Stock Batch
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Medicine Modal Overlay */}
      {showAddMedicine && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 font-sans text-slate-100">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-md text-white flex items-center gap-2">
                <Warehouse className="w-5 h-5 text-sky-400" />
                Register New Drug Profile
              </h3>
              <button onClick={() => setShowAddMedicine(false)} className="text-slate-400 hover:text-white">&times;</button>
            </div>

            <form onSubmit={handleAddMedicineSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5">Medicine Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Paracetamol"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5">Manufacturer *</label>
                  <input
                    type="text"
                    required
                    value={manufacturer}
                    onChange={(e) => setManufacturer(e.target.value)}
                    placeholder="e.g. GSK Labs"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5">Composition Formulas (Comma Separated) *</label>
                <input
                  type="text"
                  required
                  value={composition}
                  onChange={(e) => setComposition(e.target.value)}
                  placeholder="e.g. Acetaminophen, Sodium Starch"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5">Dosage Form *</label>
                  <select
                    value={dosageForm}
                    onChange={(e) => setDosageForm(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-250 focus:outline-none focus:border-sky-500"
                  >
                    <option value="TABLET">Tablet</option>
                    <option value="CAPSULE">Capsule</option>
                    <option value="LIQUID">Liquid</option>
                    <option value="INJECTION">Injection</option>
                    <option value="CREAM">Cream</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5">Strength Spec *</label>
                  <input
                    type="text"
                    required
                    value={strength}
                    onChange={(e) => setStrength(e.target.value)}
                    placeholder="e.g. 500mg"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5">Price Per Unit (₹) *</label>
                  <input
                    type="number"
                    required
                    min={0.1}
                    step={0.1}
                    value={pricePerUnit}
                    onChange={(e) => setPricePerUnit(parseFloat(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5">Expiry Date *</label>
                  <input
                    type="date"
                    required
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5">Low Stock Threshold *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={lowStockThreshold}
                    onChange={(e) => setLowStockThreshold(parseInt(e.target.value, 10))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5">Barcode ID (Optional)</label>
                <input
                  type="text"
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  placeholder="e.g. 8901030752538"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddMedicine(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white bg-slate-950 border border-slate-850 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingMed}
                  className="px-4 py-2 text-xs font-bold text-white bg-sky-500 hover:bg-sky-400 rounded-lg"
                >
                  {submittingMed ? 'Registering...' : 'Save Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Replenish Stock Modal Overlay */}
      {showReplenish && selectedReplenishMed && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 font-sans text-slate-100">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <PackageOpen className="w-5 h-5 text-sky-400" />
                Intake Stock Batch
              </h3>
              <button 
                onClick={() => {
                  setShowReplenish(false);
                  setSelectedReplenishMed(null);
                }} 
                className="text-slate-400 hover:text-white"
              >
                &times;
              </button>
            </div>

            <div className="text-xs bg-slate-955/65 p-3 rounded-lg border border-slate-850">
              <span className="font-bold text-slate-400">Target Medicine: </span>
              {selectedReplenishMed.name} ({selectedReplenishMed.strength})
            </div>

            <form onSubmit={handleReplenishSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5">Batch Number *</label>
                  <input
                    type="text"
                    required
                    value={batchNumber}
                    onChange={(e) => setBatchNumber(e.target.value)}
                    placeholder="e.g. B-998A"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5">Intake Quantity *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={batchQty}
                    onChange={(e) => setBatchQty(parseInt(e.target.value, 10))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5">Warehouse Location *</label>
                <input
                  type="text"
                  required
                  value={batchLocation}
                  onChange={(e) => setBatchLocation(e.target.value)}
                  placeholder="e.g. Aisle 1, Shelf B"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5">Supplier Name *</label>
                <input
                  type="text"
                  required
                  value={supplierName}
                  onChange={(e) => setSupplierName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5">Batch Expiry Date *</label>
                <input
                  type="date"
                  required
                  value={batchExpiry}
                  onChange={(e) => setBatchExpiry(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowReplenish(false);
                    setSelectedReplenishMed(null);
                  }}
                  className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white bg-slate-950 border border-slate-850 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingBatch}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-sky-500 hover:bg-sky-400 rounded-lg shadow-md transition-colors"
                >
                  <FileCheck2 className="w-4 h-4" />
                  {submittingBatch ? 'Replenishing...' : 'Confirm intake'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default PharmacistInventoryPage;
