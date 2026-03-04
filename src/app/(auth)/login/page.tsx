'use client';

import { jwtDecode } from 'jwt-decode';
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Script from 'next/script';
import { Eye, EyeOff } from 'lucide-react';

declare global {
  interface Window {
    google: any;
  }
}

export default function LoginPage() {
  const router = useRouter();

  const googleButtonRef = useRef<HTMLDivElement | null>(null);

  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  /* ===============================
      State
  ================================ */
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [googleReady, setGoogleReady] = useState(false);

  /* ===============================
      Google Init (SAFE)
  ================================ */
  const initializeGoogle = () => {
    if (!window.google) {
      console.log('Google not ready yet');
      return;
    }

    if (!clientId) {
      console.error('Missing Google Client ID');
      return;
    }

    if (!googleButtonRef.current) return;

    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: handleGoogleSuccess,
    });

    googleButtonRef.current.innerHTML = '';

    window.google.accounts.id.renderButton(
      googleButtonRef.current,
      {
        theme: 'outline',
        size: 'large',
        width: 320,
        shape: 'rectangular',
      }
    );

    setGoogleReady(true);

    console.log('Google button loaded');
  };

  /* ===============================
      Ensure Init When Ready
  ================================ */
  useEffect(() => {
    if (window.google && clientId) {
      initializeGoogle();
    }
  }, [clientId]);

  /* ===============================
      Google Success
  ================================ */
  const handleGoogleSuccess = async (response: any) => {
    try {
      setLoading(true);
      setError('');
  
      const decoded: any = jwtDecode(response.credential);
  
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: decoded.email,
          name: decoded.name,
          googleId: decoded.sub, // ✅ IMPORTANT
        }),
      });
  
      const data = await res.json();
  
      if (!res.ok) {
        throw new Error(data.error || 'Google login failed');
      }
  
      router.replace('/tickets');
  
    } catch (err: any) {
      setError(err.message || 'Google login failed');
    } finally {
      setLoading(false);
    }
  };
  
  /* ===============================
      Email Login
  ================================ */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Login failed');
      }

      router.replace('/tickets');
    } catch (err: any) {
      setError(err.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  /* ===============================
      UI
  ================================ */
  return (
    <>
      {/* Google Script */}
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={initializeGoogle}
      />

      <div className="space-y-8 text-white">

        {/* Brand */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold">CEi Voice</h1>
          <p className="text-sm text-zinc-400">
            Admin Support System
          </p>
        </div>

        {/* Title */}
        <div className="text-center space-y-1">
          <h2 className="text-2xl font-semibold">
            Welcome Back
          </h2>
          <p className="text-sm text-zinc-500">
            Sign in to your account
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-2 text-sm text-red-300">
            {error}
          </div>
        )}

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          {/* Email */}
          <input
            type="email"
            required
            placeholder="Email address"
            className="h-12 w-full rounded-lg border border-white/10 bg-black/40 px-4"
            value={formData.email}
            onChange={(e) =>
              setFormData({
                ...formData,
                email: e.target.value,
              })
            }
          />

          {/* Password */}
          <div className="space-y-2">

            <div className="flex justify-end">
              <Link
                href="/forgot-password"
                className="text-xs text-zinc-400 hover:text-white"
              >
                Forgot password?
              </Link>
            </div>

            <div className="relative">

              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="Password"
                className="h-12 w-full rounded-lg border border-white/10 bg-black/40 px-4 pr-12"
                value={formData.password}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    password: e.target.value,
                  })
                }
              />

              {/* Toggle */}
              <button
                type="button"
                onClick={() =>
                  setShowPassword(!showPassword)
                }
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400"
              >
                {showPassword ? (
                  <EyeOff size={18} />
                ) : (
                  <Eye size={18} />
                )}
              </button>

            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="h-12 w-full rounded-lg bg-white text-black font-semibold"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-white/10" />
          <span className="text-xs text-zinc-500">OR</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>

        {/* Google Button */}
        <div className="flex justify-center min-h-[44px]">
          <div
            ref={googleButtonRef}
            className="w-full flex justify-center"
          />
        </div>

        {!googleReady && (
          <p className="text-center text-xs text-zinc-500">
            Loading Google Sign-in...
          </p>
        )}

        {/* Footer */}
        <p className="text-center text-xs text-zinc-500">
          Don’t have an account?{' '}
          <Link
            href="/register"
            className="text-white hover:underline"
          >
            Sign up
          </Link>
        </p>

      </div>
    </>
  );
}