'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '../../../../components/layout/Navbar';
import { landlordAPI, paymentsAPI } from '../../../../lib/api';
import { useAuthStore } from '../../../../store/authStore';
import { cn, formatKES } from '../../../../lib/utils';
import { Zap, ArrowLeft, Loader2, CheckCircle, Phone, Star } from 'lucide-react';
import toast from 'react-hot-toast';

interface Package { days: number; amount: number; label: string; popular: boolean; }

type Step = 'choose' | 'pay' | 'confirm' | 'done';

export default function BoostPage() {
  const { id }   = useParams<{ id: string }>();
  const router   = useRouter();
  const { user, isAuthenticated } = useAuthStore();

  const [listing,    setListing]    = useState<any>(null);
  const [packages,   setPackages]   = useState<Package[]>([]);
  const [selected,   setSelected]   = useState<Package | null>(null);
  const [phone,      setPhone]      = useState('');
  const [mpesaCode,  setMpesaCode]  = useState('');
  const [paymentId,  setPaymentId]  = useState('');
  const [checkoutId, setCheckoutId] = useState('');
  const [isManual,   setIsManual]   = useState(false);
  const [step,       setStep]       = useState<Step>('choose');
  const [loading,    setLoading]    = useState(false);
  const [pageLoading,setPageLoading]= useState(true);

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'LANDLORD') { router.push('/auth/login'); return; }
    Promise.all([
      landlordAPI.getListing(id),
      paymentsAPI.packages(),
    ]).then(([lRes, pRes]) => {
      setListing(lRes.data.data);
      setPackages(pRes.data.data);
      setSelected(pRes.data.data.find((p: Package) => p.popular) || pRes.data.data[0]);
    }).catch(() => toast.error('Could not load listing.'))
    .finally(() => setPageLoading(false));
  }, [id, isAuthenticated, user]);

  const initiateBoost = async () => {
    if (!selected || !phone.trim()) { toast.error('Select a package and enter your M-Pesa number.'); return; }
    setLoading(true);
    try {
      const res = await paymentsAPI.boost({ apartment_id: id, days: selected.days, phone: phone.trim() });
      const data = res.data.data;
      setPaymentId(data.payment_id);
      setIsManual(data.manual);
      if (!data.manual) setCheckoutId(data.checkout_id);
      setStep('pay');
      toast.success(data.message);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Could not initiate payment.');
    } finally {
      setLoading(false);
    }
  };

  const confirmPayment = async () => {
    if (!mpesaCode.trim()) { toast.error('Enter your M-Pesa transaction code.'); return; }
    setLoading(true);
    try {
      await paymentsAPI.confirm(paymentId, mpesaCode.trim());
      setStep('done');
      toast.success('Boost activated!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Could not confirm payment.');
    } finally {
      setLoading(false);
    }
  };

  const pollStatus = async () => {
    if (!checkoutId) return;
    setLoading(true);
    try {
      const res = await paymentsAPI.status(checkoutId);
      if (res.data.data.status === 'COMPLETED') {
        setStep('done');
        toast.success('Boost activated!');
      } else {
        toast('Payment still pending — enter PIN on your phone.', { icon: '⏳' });
      }
    } catch {
      toast.error('Could not check payment status.');
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-surface-50 dark:bg-navy-950">
      <Loader2 size={32} className="animate-spin text-amber-500" />
    </div>
  );

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-navy-950">
      <Navbar />
      <div className="max-w-xl mx-auto px-4 pt-24 pb-20">

        <Link href="/landlord/dashboard"
          className="inline-flex items-center gap-1.5 text-sm text-navy-500 hover:text-amber-600 mb-6 group transition-colors">
          <ArrowLeft size={15} className="group-hover:-translate-x-0.5 transition-transform" /> Back to Dashboard
        </Link>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg">
            <Zap size={22} className="text-white" />
          </div>
          <div>
            <h1 className="font-display font-extrabold text-xl text-navy-900 dark:text-white">Boost Listing</h1>
            {listing && <p className="text-sm text-navy-500 dark:text-navy-400 truncate max-w-xs">{listing.title}</p>}
          </div>
        </div>

        {/* Step: Choose package */}
        {step === 'choose' && (
          <div className="space-y-4">
            <div className="card p-5">
              <h2 className="font-display font-bold text-base text-navy-900 dark:text-white mb-1">Choose a boost package</h2>
              <p className="text-xs text-navy-500 dark:text-navy-400 mb-4">
                Boosted listings appear at the top of search results and browse pages.
              </p>
              <div className="space-y-3">
                {packages.map(pkg => (
                  <button key={pkg.days} onClick={() => setSelected(pkg)}
                    className={cn('w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all text-left',
                      selected?.days === pkg.days
                        ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20'
                        : 'border-surface-200 dark:border-navy-700 bg-white dark:bg-navy-800 hover:border-amber-300')}>
                    <div className="flex items-center gap-3">
                      <div className={cn('w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0',
                        selected?.days === pkg.days ? 'border-amber-500' : 'border-surface-300 dark:border-navy-600')}>
                        {selected?.days === pkg.days && <div className="w-2 h-2 bg-amber-500 rounded-full" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-display font-bold text-sm text-navy-900 dark:text-white">{pkg.label}</p>
                          {pkg.popular && (
                            <span className="px-2 py-0.5 bg-amber-500 text-white text-xs font-semibold rounded-full flex items-center gap-1">
                              <Star size={9} className="fill-white" /> Popular
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-navy-500 dark:text-navy-400">Featured for {pkg.days} days</p>
                      </div>
                    </div>
                    <p className="font-display font-extrabold text-amber-600 dark:text-amber-400">
                      KES {pkg.amount}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            <div className="card p-5">
              <h2 className="font-display font-bold text-sm text-navy-900 dark:text-white mb-3">M-Pesa Number</h2>
              <div className="relative">
                <Phone size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-navy-400" />
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="0712 345 678"
                  className="input pl-9 w-full"
                />
              </div>
              <p className="text-xs text-navy-400 mt-2">You will receive an M-Pesa STK push on this number.</p>
            </div>

            {selected && (
              <div className="card p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-navy-700 dark:text-navy-300">Total to pay</span>
                  <span className="font-display font-extrabold text-amber-600 dark:text-amber-400 text-lg">KES {selected.amount}</span>
                </div>
              </div>
            )}

            <button onClick={initiateBoost} disabled={loading || !selected || !phone.trim()}
              className="btn-primary w-full py-3.5 justify-center text-base disabled:opacity-50">
              {loading ? <><Loader2 size={16} className="animate-spin" /> Processing…</> : <><Zap size={16} /> Pay with M-Pesa</>}
            </button>
          </div>
        )}

        {/* Step: Pay */}
        {step === 'pay' && (
          <div className="card p-6 space-y-5">
            {isManual ? (
              <>
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Phone size={28} className="text-green-600 dark:text-green-400" />
                  </div>
                  <h2 className="font-display font-bold text-lg text-navy-900 dark:text-white mb-2">Make M-Pesa Payment</h2>
                  <p className="text-sm text-navy-500 dark:text-navy-400">Send the amount below via M-Pesa Paybill then enter your transaction code.</p>
                </div>
                <div className="bg-surface-50 dark:bg-navy-800 rounded-xl p-4 space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-navy-500">Paybill</span><span className="font-bold text-navy-900 dark:text-white">{process.env.NEXT_PUBLIC_MPESA_SHORTCODE || '400200'}</span></div>
                  <div className="flex justify-between"><span className="text-navy-500">Account</span><span className="font-bold text-navy-900 dark:text-white font-mono">MachaRent-{paymentId.slice(0, 8)}</span></div>
                  <div className="flex justify-between"><span className="text-navy-500">Amount</span><span className="font-bold text-amber-600">KES {selected?.amount}</span></div>
                </div>
              </>
            ) : (
              <div className="text-center">
                <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Phone size={28} className="text-amber-600 dark:text-amber-400" />
                </div>
                <h2 className="font-display font-bold text-lg text-navy-900 dark:text-white mb-2">Check your phone</h2>
                <p className="text-sm text-navy-500 dark:text-navy-400">
                  An M-Pesa prompt has been sent to <strong>{phone}</strong>. Enter your PIN to complete payment.
                </p>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-semibold text-navy-700 dark:text-navy-300">M-Pesa Transaction Code</label>
              <input
                value={mpesaCode}
                onChange={e => setMpesaCode(e.target.value.toUpperCase())}
                placeholder="e.g. QHX7K2MNOP"
                className="input w-full font-mono tracking-widest uppercase"
                maxLength={12}
              />
              <p className="text-xs text-navy-400">Found in your M-Pesa confirmation SMS.</p>
            </div>

            <div className="flex gap-3">
              {!isManual && (
                <button onClick={pollStatus} disabled={loading}
                  className="flex-1 btn-secondary py-3 justify-center text-sm disabled:opacity-50">
                  {loading ? <Loader2 size={14} className="animate-spin" /> : 'Check Status'}
                </button>
              )}
              <button onClick={confirmPayment} disabled={loading || !mpesaCode.trim()}
                className="flex-1 btn-primary py-3 justify-center text-sm disabled:opacity-50">
                {loading ? <><Loader2 size={14} className="animate-spin" /> Confirming…</> : 'Confirm Payment'}
              </button>
            </div>
          </div>
        )}

        {/* Step: Done */}
        {step === 'done' && (
          <div className="card p-8 text-center space-y-5">
            <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle size={40} className="text-emerald-500" />
            </div>
            <div>
              <h2 className="font-display font-extrabold text-xl text-navy-900 dark:text-white mb-2">Listing Boosted! 🚀</h2>
              <p className="text-navy-500 dark:text-navy-400 text-sm">
                Your listing is now featured at the top of search results for <strong>{selected?.days} days</strong>.
              </p>
            </div>
            <Link href="/landlord/dashboard" className="btn-primary px-8 py-3 justify-center w-full">
              Back to Dashboard
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
