'use client';

import { jwtDecode } from 'jwt-decode';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Script from 'next/script';
import { Eye, EyeOff } from 'lucide-react';

/* ---------------- Types ---------------- */

declare global {
  interface Window {
    google: any;
  }
}

interface PasswordStrength {
  label: string;
  color: string;
  width: string;
  text: string;
  textColor: string;
}

/* ---------------- Page ---------------- */

export default function RegisterPage() {
  const router = useRouter();
  const googleButtonRef = useRef<HTMLDivElement | null>(null);

  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  /* ---------------- State ---------------- */

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const googleLoaded = useRef(false);

  /* ---------------- Password Strength ---------------- */

  const calculateStrength = (password: string): PasswordStrength => {
    let score = 0;

    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (score <= 1) {
      return {
        label: 'Poor',
        color: 'bg-red-500',
        width: '33%',
        text: 'Weak password',
        textColor: 'text-red-400',
      };
    }

    if (score <= 3) {
      return {
        label: 'Average',
        color: 'bg-yellow-500',
        width: '66%',
        text: 'Could be stronger',
        textColor: 'text-yellow-400',
      };
    }

    return {
      label: 'Strong',
      color: 'bg-green-500',
      width: '100%',
      text: 'Great password',
      textColor: 'text-green-400',
    };
  };

  const passwordStrength = calculateStrength(formData.password);
  const confirmStrength = calculateStrength(formData.confirmPassword);

  /* ---------------- Google Init ---------------- */

  const initializeGoogle = () => {
    if (
      !window.google ||
      !clientId ||
      !googleButtonRef.current ||
      googleLoaded.current
    ) {
      return;
    }

    googleLoaded.current = true;

    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: handleGoogleSuccess,
    });

    googleButtonRef.current.innerHTML = '';

    window.google.accounts.id.renderButton(googleButtonRef.current, {
      theme: 'outline',
      size: 'large',
      text: 'signup_with',
      width: 360,
    });
  };

  useEffect(() => {
    if (window.google) {
      initializeGoogle();
    }
  }, []);

  /* ---------------- Google Register ---------------- */

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
        throw new Error(data.error || 'Google signup failed');
      }

      router.replace('/tickets');

    } catch (err: any) {
      setError(err.message || 'Google sign-in failed');
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- Normal Register ---------------- */

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setError('');

    if (passwordStrength.label === 'Poor') {
      return setError('Password is too weak');
    }

    if (formData.password !== formData.confirmPassword) {
      return setError('Passwords do not match');
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      router.replace('/tickets');

    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- UI ---------------- */

  return (
    <>
      {/* Google Script */}
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={initializeGoogle}
      />

      <div className="space-y-6 max-w-md mx-auto">

        <h1 className="text-3xl font-bold text-white text-center">
          Create Account
        </h1>

        {/* Error */}
        {error && (
          <div className="bg-red-900/40 border border-red-500 text-red-300 px-4 py-3 rounded-xl text-sm">
            {error}
          </div>
        )}

        {/* Register Form */}
        <form onSubmit={handleSubmit} className="space-y-4">

          <input
            type="text"
            required
            placeholder="Full Name"
            className="h-12 w-full rounded-xl bg-zinc-900 px-4 text-white"
            value={formData.name}
            onChange={(e) =>
              setFormData({ ...formData, name: e.target.value })
            }
          />

          <input
            type="email"
            required
            placeholder="Email"
            className="h-12 w-full rounded-xl bg-zinc-900 px-4 text-white"
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
          />

          <PasswordField
            value={formData.password}
            onChange={(v) =>
              setFormData({ ...formData, password: v })
            }
            show={showPassword}
            toggle={() => setShowPassword(!showPassword)}
            strength={passwordStrength}
            placeholder="Password"
          />

          <PasswordField
            value={formData.confirmPassword}
            onChange={(v) =>
              setFormData({ ...formData, confirmPassword: v })
            }
            show={showConfirm}
            toggle={() => setShowConfirm(!showConfirm)}
            strength={confirmStrength}
            placeholder="Confirm Password"
          />

          <button
            type="submit"
            disabled={loading}
            className="h-12 w-full rounded-xl bg-white text-black font-semibold disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Sign Up'}
          </button>

        </form>

        {/* Google Button */}
        <div className="flex justify-center">
          <div ref={googleButtonRef} />
        </div>

        {/* Login Link */}
        <p className="text-center text-sm text-zinc-400">
          Already have an account?{' '}
          <Link href="/login" className="underline">
            Sign in
          </Link>
        </p>

      </div>
    </>
  );
}

/* ---------------- Components ---------------- */

function PasswordField({
  value,
  onChange,
  show,
  toggle,
  strength,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  show: boolean;
  toggle: () => void;
  strength: PasswordStrength;
  placeholder: string;
}) {
  return (
    <div className="space-y-2">

      <div className="relative">

        <input
          type={show ? 'text' : 'password'}
          required
          placeholder={placeholder}
          className="h-12 w-full rounded-xl bg-zinc-900 px-4 pr-12 text-white"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />

        <button
          type="button"
          onClick={toggle}
          className="absolute right-4 top-3 text-zinc-400"
        >
          {show ? <EyeOff size={20} /> : <Eye size={20} />}
        </button>

      </div>

      {value && <StrengthBar strength={strength} />}

    </div>
  );
}

function StrengthBar({ strength }: { strength: PasswordStrength }) {
  return (
    <div className="space-y-1">

      <div className="flex justify-between text-sm">
        <span className="text-zinc-400">Password Strength</span>
        <span className={`font-medium ${strength.textColor}`}>
          {strength.label}
        </span>
      </div>

      <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
        <div
          className={`h-full ${strength.color}`}
          style={{ width: strength.width }}
        />
      </div>

      <p className={`text-xs ${strength.textColor}`}>
        {strength.text}
      </p>

    </div>
  );
}