'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] =
    useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setMessage('');

    try {
      const res = await fetch('/api/auth/password-reset/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setStatus('success');
      setMessage(
        'If an account exists with that email, we have sent a reset link.'
      );
    } catch (err: any) {
      setStatus('error');
      setMessage(err.message || 'Failed to send reset link');
    }
  };

  return (
    <div className="max-w-md mx-auto mt-20 space-y-6">
      <h1 className="text-3xl font-bold text-white text-center">
        Forgot Password
      </h1>

      {status === 'success' ? (
        <div className="bg-green-900/30 border border-green-900 text-green-300 px-4 py-3 rounded-md text-sm text-center">
          {message}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            required
            placeholder="name@example.com"
            className="h-12 w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 text-white"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <button
            type="submit"
            disabled={status === 'loading'}
            className="h-12 w-full rounded-xl bg-white text-black font-semibold hover:opacity-90 disabled:opacity-50"
          >
            {status === 'loading'
              ? 'Sending...'
              : 'Send Reset Link'}
          </button>
        </form>
      )}

      <p className="text-center text-sm text-zinc-400">
        Remember your password?{' '}
        <Link href="/login" className="underline hover:text-white">
          Log in
        </Link>
      </p>
    </div>
  );
}
