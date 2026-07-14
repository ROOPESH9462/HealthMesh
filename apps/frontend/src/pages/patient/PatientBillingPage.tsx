import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { 
  CreditCard, 
  CheckCircle2, 
  AlertCircle, 
  Receipt,
  ShieldCheck
} from 'lucide-react';
import { formatDate } from '@healthcare/shared-utils';

interface BillItem {
  description: string;
  amount: number;
}

interface Bill {
  id: string;
  patientId: string;
  appointmentId?: string;
  prescriptionId?: string;
  items: BillItem[];
  taxAmount: number;
  totalAmount: number;
  insuranceCoveredAmount: number;
  netPayableAmount: number;
  status: string;
  createdAt: string;
}

const PatientBillingPage: React.FC = () => {
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Checkout states
  const [activeBill, setActiveBill] = useState<Bill | null>(null);
  const [intentId, setIntentId] = useState('');
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  
  // Card input states
  const [cardNumber, setCardNumber] = useState('4242 •••• •••• 4242');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvc, setCardCvc] = useState('***');
  const [cardName, setCardName] = useState('John Doe');

  const fetchBills = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await api.get('/billing');
      setBills(res.data.data || []);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to load billing history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBills();
  }, []);

  const handleStartCheckout = async (bill: Bill) => {
    setActiveBill(bill);
    setCheckoutLoading(true);
    setErrorMsg(null);
    try {
      const res = await api.post(`/billing/${bill.id}/payment-intent`);
      setIntentId(res.data.data.paymentIntentId);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to generate checkout session.');
      setActiveBill(null);
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handlePayConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeBill || !intentId) return;

    setCheckoutLoading(true);
    try {
      // Simulate Stripe checkout success webhook callback to confirm payment
      await api.post('/billing/webhook', {
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: intentId
          }
        }
      });

      // Refresh invoices
      fetchBills();
      setActiveBill(null);
      setIntentId('');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Payment processing failed.');
    } finally {
      setCheckoutLoading(false);
    }
  };

  const unpaidInvoices = bills.filter((b) => b.status === 'PENDING');
  const paidInvoices = bills.filter((b) => b.status === 'COMPLETED');

  return (
    <div className="space-y-6 text-slate-100 font-sans">
      
      {/* Header */}
      <div className="flex flex-col gap-1 border-b border-slate-800 pb-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Receipt className="w-5 h-5 text-sky-400" />
          Billing Ledger & Invoices
        </h2>
        <p className="text-xs text-slate-400">Review outstanding fees, consultation statements, and pay clinical invoices securely</p>
      </div>

      {errorMsg && (
        <div className="flex items-start gap-3 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <div>
            <p className="font-semibold">Billing Notice</p>
            <p className="text-xs mt-0.5 leading-relaxed">{errorMsg}</p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-slate-550 text-sm">Loading invoices summary...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Column 1: Unpaid Statements */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
              Pending Invoices
            </h3>

            {unpaidInvoices.length === 0 ? (
              <div className="text-center py-10 bg-slate-900/10 border border-slate-850 rounded-xl text-slate-550 text-xs">
                No outstanding invoices registered
              </div>
            ) : (
              unpaidInvoices.map((bill) => (
                <div key={bill.id} className="p-5 bg-slate-900/30 border border-slate-800 rounded-2xl flex flex-col justify-between gap-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-xs text-slate-400 uppercase tracking-wider">
                        Invoice ID: #{bill.id.slice(-8).toUpperCase()}
                      </h4>
                      <p className="text-[10px] text-slate-500 mt-0.5">{formatDate(bill.createdAt)}</p>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/15">
                      Unpaid
                    </span>
                  </div>

                  {/* Items */}
                  <div className="space-y-1 bg-slate-950/40 p-3 rounded-lg text-xs">
                    {bill.items.map((it, i) => (
                      <div key={i} className="flex justify-between text-slate-400">
                        <span>{it.description}</span>
                        <span className="font-mono">₹{it.amount}</span>
                      </div>
                    ))}
                    <div className="flex justify-between text-slate-500 border-t border-slate-900 mt-2 pt-2">
                      <span>Tax (18% GST)</span>
                      <span className="font-mono">₹{bill.taxAmount}</span>
                    </div>
                    {bill.insuranceCoveredAmount > 0 && (
                      <div className="flex justify-between text-emerald-500 font-bold">
                        <span>Insurance Covered</span>
                        <span className="font-mono">-₹{bill.insuranceCoveredAmount}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-white font-bold border-t border-slate-900 mt-1 pt-1">
                      <span>Net Payable Amount</span>
                      <span className="font-mono text-sky-400 text-sm">₹{bill.netPayableAmount}</span>
                    </div>
                  </div>

                  <div className="flex justify-end pt-2 border-t border-slate-800/40">
                    <button
                      onClick={() => handleStartCheckout(bill)}
                      className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-sky-500 hover:bg-sky-400 rounded-lg shadow-md transition-all duration-200"
                    >
                      <CreditCard className="w-4 h-4" />
                      Proceed to Checkout
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Column 2: Receipt History */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-450 mb-2 flex items-center gap-2">
              <CheckCircle2 className="w-4.5 h-4.5 text-slate-650" />
              Receipt History
            </h3>

            {paidInvoices.length === 0 ? (
              <div className="text-center py-10 bg-slate-900/10 border border-slate-850 rounded-xl text-slate-550 text-xs">
                No past transactions recorded
              </div>
            ) : (
              paidInvoices.map((bill) => (
                <div key={bill.id} className="p-4 bg-slate-900/10 border border-slate-850 rounded-xl flex items-center justify-between gap-4 opacity-70">
                  <div className="space-y-1">
                    <h4 className="font-bold text-xs text-slate-350">
                      Invoice ID: #{bill.id.slice(-8).toUpperCase()}
                    </h4>
                    <div className="flex gap-4 text-[10px] text-slate-500 font-semibold">
                      <span>{formatDate(bill.createdAt)}</span>
                      <span>GST: ₹{bill.taxAmount}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-emerald-400 font-mono block">₹{bill.netPayableAmount}</span>
                    <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-wider mt-0.5 block">Paid</span>
                  </div>
                </div>
              ))
            )}
          </div>

        </div>
      )}

      {/* Mock Stripe Elements Checkout Modal */}
      {activeBill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 font-sans text-slate-100">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-sky-400" />
                Stripe Secure Checkout
              </h3>
              <button 
                onClick={() => {
                  setActiveBill(null);
                  setIntentId('');
                }} 
                className="text-slate-400 hover:text-white"
              >
                &times;
              </button>
            </div>

            <div className="flex justify-between items-center bg-slate-950/60 p-4 rounded-xl border border-slate-850">
              <div className="space-y-0.5">
                <span className="text-[10px] text-slate-450 uppercase block font-semibold">Payable to Clinic</span>
                <span className="text-xs text-slate-300 font-medium">Consultation Invoice #{activeBill.id.slice(-6).toUpperCase()}</span>
              </div>
              <span className="text-md font-bold text-white font-mono">₹{activeBill.netPayableAmount}</span>
            </div>

            <form onSubmit={handlePayConfirm} className="space-y-4">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
                  Cardholder Name
                </label>
                <input
                  type="text"
                  required
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
                  Card Details (Stripe Mock Sandbox)
                </label>
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg flex flex-col sm:flex-row gap-3">
                  <input
                    type="text"
                    required
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    placeholder="4242 4242 4242 4242"
                    className="bg-transparent text-sm text-slate-200 focus:outline-none w-full sm:w-2/3"
                  />
                  <div className="flex gap-2 w-full sm:w-1/3 border-t sm:border-t-0 sm:border-l border-slate-850 pt-2 sm:pt-0 sm:pl-3">
                    <input
                      type="text"
                      required
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(e.target.value)}
                      placeholder="MM/YY"
                      className="bg-transparent text-xs text-slate-350 focus:outline-none w-1/2"
                    />
                    <input
                      type="text"
                      required
                      value={cardCvc}
                      onChange={(e) => setCardCvc(e.target.value)}
                      placeholder="CVC"
                      className="bg-transparent text-xs text-slate-350 focus:outline-none w-1/2"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 text-[10px] text-slate-450 bg-slate-950/20 p-2.5 rounded border border-slate-850/50">
                <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Fully encrypted by Stripe SSL. Sandbox simulation active.</span>
              </div>

              <button
                type="submit"
                disabled={checkoutLoading}
                className="flex items-center justify-center gap-2 w-full py-3 text-sm font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-450 hover:to-teal-500 rounded-lg shadow-lg transition-all duration-200"
              >
                {checkoutLoading ? 'Encrypting keys...' : `Authorize Payment (₹${activeBill.netPayableAmount})`}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default PatientBillingPage;
