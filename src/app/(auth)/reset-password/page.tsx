'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] =
    useState<'idle' | 'loading' | 'error' | 'success'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      setStatus('error');
      setMessage('Invalid reset link.');
      return;
    }

    if (password !== confirmPassword) {
      setStatus('error');
      setMessage('Passwords do not match.');
      return;
    }

    setStatus('loading');

    try {
      const res = await fetch(
        '/api/auth/password-reset/confirm',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token,
            newPassword: password,
          }),
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setStatus('success');
      setMessage('Password updated successfully! Redirecting...');

      setTimeout(() => {
        router.push('/login');
      }, 2000);

    } catch (err: any) {
      setStatus('error');
      setMessage(err.message);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-20 space-y-6">
      <h1 className="text-3xl font-bold text-white text-center">
        Reset Password
      </h1>

      {status === 'error' && (
        <div className="text-red-400 text-center">
          {message}
        </div>
      )}

      {status === 'success' && (
        <div className="text-green-400 text-center">
          {message}
        </div>
      )}

      {status !== 'success' && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            required
            placeholder="New password"
            className="h-12 w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 text-white"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <input
            type="password"
            required
            placeholder="Confirm password"
            className="h-12 w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 text-white"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />

          <button
            type="submit"
            disabled={status === 'loading'}
            className="h-12 w-full rounded-xl bg-white text-black font-semibold"
          >
            {status === 'loading'
              ? 'Updating...'
              : 'Update Password'}
          </button>

          <p className="text-center text-sm text-zinc-400">
            Remember your password?{' '}
            <Link href="/login" className="underline">
              Log in
            </Link>
          </p>
        </form>
      )}
    </div>
  );
}
