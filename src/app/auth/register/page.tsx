'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, Phone, Lock, User, Building2, Eye, EyeOff, Loader2, ArrowRight, CheckCircle } from 'lucide-react';
import { authAPI } from '../../../lib/api';
import { persistAuth } from '../../../store/authStore';
import { normalizePhone } from '../../../lib/utils';
import toast from 'react-hot-toast';

type Role = 'TENANT' | 'LANDLORD';

function RegisterForm() {
  const router       = useRouter();
  const searchParams = useSearchParams();

  const [step,     setStep]     = useState<'role' | 'details'>('role');
  const [role,     setRole]     = useState<Role>((searchParams.get('role') as Role) || 'TENANT');
  const [phone,    setPhone]    = useState('');
  const [password, setPassword] = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [fullName, setFullName] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading,  setLoading]  = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm)  { toast.error('Passwords do not match.');             return; }
    if (password.length < 6)   { toast.error('Password must be at least 6 chars.'); return; }

    setLoading(true);
    try {
      const res = await authAPI.register({
        phone:     normalizePhone(phone),
        password,
        role,
        full_name: fullName.trim() || undefined,
      });
      const { accessToken, refreshToken, user } = res.data.data;
      persistAuth(accessToken, refreshToken, user);
      toast.success('Account created! Welcome to MachaRent 🏠');
      router.push(user.role === 'LANDLORD' ? '/landlord/dashboard' : '/listings');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Registration failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 relative bg-navy-950 dot-pattern items-center justify-center p-12">
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 80% 60% at 60% 30%, rgba(245,158,11,0.1) 0%, transparent 65%)' }} />
        <div className="relative z-10 max-w-sm">
          <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center mb-8">
            <Home size={22} className="text-white" strokeWidth={2.5} />
          </div>
          <h2 className="font-display font-extrabold text-4xl text-white leading-tight mb-4">
            Your home in Machakos awaits.
          </h2>
          <p className="text-white/60 text-base leading-relaxed mb-10">
            Join tenants and landlords who trust MachaRent for verified, scam-free rentals.
          </p>
          <div className="space-y-3">
            {['Admin-verified listings only','GPS-pinned exact locations','Direct landlord contact','Genuine tenant reviews'].map(item => (
              <div key={item} className="flex items-center gap-3">
                <CheckCircle size={16} className="text-amber-400 flex-shrink-0" />
                <span className="text-white/70 text-sm">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-16 bg-surface-50 dark:bg-navy-950 overflow-y-auto">
        <Link href="/" className="flex items-center gap-2 mb-10 group lg:hidden">
          <div className="w-9 h-9 bg-amber-500 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
            <Home size={17} className="text-white" strokeWidth={2.5} />
          </div>
          <span className="font-display font-bold text-xl text-navy-900 dark:text-white">MachaRent</span>
        </Link>

        <div className="w-full max-w-sm">
          <AnimatePresence mode="wait">

            {step === 'role' && (
              <motion.div key="role"
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.18 }}>
                <h1 className="font-display font-bold text-2xl text-navy-900 dark:text-white mb-1">Create account</h1>
                <p className="text-navy-500 dark:text-navy-400 text-sm mb-7">How will you use MachaRent?</p>

                <div className="grid grid-cols-2 gap-3 mb-6">
                  {[
                    { v: 'TENANT'   as Role, icon: User,      title: "I'm a Tenant",   sub: 'Looking for a home' },
                    { v: 'LANDLORD' as Role, icon: Building2,  title: "I'm a Landlord", sub: 'Listing property'   },
                  ].map(opt => (
                    <button key={opt.v} onClick={() => setRole(opt.v)}
                      className={`flex flex-col items-center gap-2 p-5 rounded-2xl border-2 transition-all duration-200 ${
                        role === opt.v
                          ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20'
                          : 'border-surface-200 dark:border-navy-700 hover:border-amber-300'
                      }`}>
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        role === opt.v ? 'bg-amber-500 text-white' : 'bg-surface-100 dark:bg-navy-800 text-navy-500'
                      }`}>
                        <opt.icon size={18} />
                      </div>
                      <div className="text-center">
                        <p className={`font-display font-semibold text-xs ${role === opt.v ? 'text-amber-700 dark:text-amber-400' : 'text-navy-800 dark:text-navy-200'}`}>
                          {opt.title}
                        </p>
                        <p className="text-xs text-navy-400 mt-0.5">{opt.sub}</p>
                      </div>
                    </button>
                  ))}
                </div>

                <button onClick={() => setStep('details')} className="btn-primary w-full py-3 justify-center">
                  Continue as {role === 'TENANT' ? 'Tenant' : 'Landlord'} <ArrowRight size={15} />
                </button>

                <p className="text-center text-sm text-navy-500 dark:text-navy-400 mt-5">
                  Already have an account?{' '}
                  <Link href="/auth/login" className="text-amber-600 dark:text-amber-400 font-semibold hover:underline">Sign in</Link>
                </p>
              </motion.div>
            )}

            {step === 'details' && (
              <motion.div key="details"
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.18 }}>
                <button onClick={() => setStep('role')}
                  className="flex items-center gap-1.5 text-sm text-navy-400 hover:text-amber-500 mb-6 transition-colors">
                  ← Back
                </button>

                <h1 className="font-display font-bold text-2xl text-navy-900 dark:text-white mb-1">Your details</h1>
                <p className="text-navy-500 dark:text-navy-400 text-sm mb-7">
                  Registering as a <span className="font-semibold text-amber-600 dark:text-amber-400">
                    {role === 'TENANT' ? 'Tenant' : 'Landlord'}
                  </span>
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="label">Full Name <span className="text-navy-400 font-normal text-xs">(optional)</span></label>
                    <div className="relative">
                      <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-navy-400 pointer-events-none" />
                      <input type="text" value={fullName} onChange={e => setFullName(e.target.value)}
                        placeholder="e.g. Jane Muthoni" className="input pl-10" />
                    </div>
                  </div>

                  <div>
                    <label className="label">Phone Number</label>
                    <div className="relative">
                      <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-navy-400 pointer-events-none" />
                      <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                        placeholder="0712 345 678" className="input pl-10" required autoFocus />
                    </div>
                    <p className="text-xs text-navy-400 mt-1">Kenyan number starting with 07 or 01</p>
                  </div>

                  <div>
                    <label className="label">Password</label>
                    <div className="relative">
                      <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-navy-400 pointer-events-none" />
                      <input type={showPass ? 'text' : 'password'} value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="Min. 6 characters" className="input pl-10 pr-10" required />
                      <button type="button" onClick={() => setShowPass(!showPass)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-navy-400 hover:text-navy-600 transition-colors">
                        {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="label">Confirm Password</label>
                    <div className="relative">
                      <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-navy-400 pointer-events-none" />
                      <input type={showPass ? 'text' : 'password'} value={confirm}
                        onChange={e => setConfirm(e.target.value)}
                        placeholder="Repeat your password" className="input pl-10" required />
                    </div>
                    {confirm && password !== confirm && (
                      <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
                    )}
                  </div>

                  <button type="submit" disabled={loading || !phone || !password || !confirm}
                    className="btn-primary w-full py-3 justify-center mt-2">
                    {loading
                      ? <><Loader2 size={16} className="animate-spin" /> Creating account…</>
                      : 'Create Account'}
                  </button>
                </form>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 size={32} className="animate-spin text-amber-500" /></div>}>
      <RegisterForm />
    </Suspense>
  );
}