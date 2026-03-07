'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Home, Phone, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import { authAPI } from '../../../lib/api';
import { persistAuth } from '../../../store/authStore';
import { normalizePhone } from '../../../lib/utils';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const router = useRouter();

  const [phone,    setPhone]    = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading,  setLoading]  = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await authAPI.login(normalizePhone(phone), password);
      const { accessToken, refreshToken, user } = res.data.data;
      persistAuth(accessToken, refreshToken, user);
      toast.success('Welcome back!');
      if (user.role === 'LANDLORD') router.push('/landlord/dashboard');
      else if (user.role === 'ADMIN') router.push('/admin/dashboard');
      else router.push('/listings');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Login failed. Check your details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-surface-50 dark:bg-navy-950 px-6 py-16">
      <Link href="/" className="flex items-center gap-2 mb-10 group">
        <div className="w-9 h-9 bg-amber-500 rounded-xl flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
          <Home size={17} className="text-white" strokeWidth={2.5} />
        </div>
        <span className="font-display font-bold text-xl text-navy-900 dark:text-white">Mazingira</span>
      </Link>

      <div className="w-full max-w-sm card p-8">
        <h1 className="font-display font-bold text-2xl text-navy-900 dark:text-white mb-1">Sign in</h1>
        <p className="text-navy-500 dark:text-navy-400 text-sm mb-7">Welcome back to Mazingira</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Phone Number</label>
            <div className="relative">
              <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-navy-400 pointer-events-none" />
              <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                placeholder="0712 345 678" className="input pl-10" required autoFocus />
            </div>
          </div>

          <div>
            <label className="label">Password</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-navy-400 pointer-events-none" />
              <input type={showPass ? 'text' : 'password'} value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Your password" className="input pl-10 pr-10" required />
              <button type="button" onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-navy-400 hover:text-navy-600 transition-colors">
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading || !phone || !password}
            className="btn-primary w-full py-3 justify-center mt-2">
            {loading ? <><Loader2 size={16} className="animate-spin" /> Signing in…</> : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-sm text-navy-500 dark:text-navy-400 mt-6">
          Don't have an account?{' '}
          <Link href="/auth/register" className="text-amber-600 dark:text-amber-400 font-semibold hover:underline">
            Create one
          </Link>
        </p>
      </div>

      <p className="text-center text-xs text-navy-400 dark:text-navy-600 mt-6">
        Just browsing?{' '}
        <Link href="/listings" className="hover:text-amber-500 underline transition-colors">
          View listings without signing in
        </Link>
      </p>
    </div>
  );
}