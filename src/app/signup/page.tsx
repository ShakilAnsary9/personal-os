'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signUpWithEmail, signInWithGoogle } from '@/lib/auth';
import { toast } from '@/components/Toast';

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleEmail(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await signUpWithEmail(email, password);
      if (error) {
        toast(error.message);
        setLoading(false);
      } else {
        toast('Check your email for confirmation link');
        setLoading(false);
      }
    } catch (err) {
      toast((err as Error).message || 'Could not sign up — check your connection');
      setLoading(false);
    }
  }

  async function handleGoogle() {
    try {
      const { error } = await signInWithGoogle();
      if (error) toast(error.message);
    } catch (err) {
      toast((err as Error).message || 'Could not reach the sign-in server');
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <svg width="36" height="36" viewBox="0 0 30 30" fill="none">
            <rect x="1.5" y="1.5" width="27" height="27" rx="3" stroke="#20261F" strokeWidth="2" fill="#FAF7EC" />
            <path d="M6 22 10.5 8h3.2L18 22h-3.1l-.8-2.7H9.9L9.1 22H6Zm4.6-5.2h3l-1.5-5-1.5 5Z" fill="#E8432D" />
            <path d="M19.5 22V8h2.9v14h-2.9Z" fill="#20261F" />
          </svg>
          <h1>Create your workspace</h1>
          <p className="auth-sub">14-day free trial · No credit card required</p>
        </div>

        <button className="auth-google" onClick={handleGoogle} type="button">
          <svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
          Continue with Google
        </button>

        <div className="auth-divider"><span>or</span></div>

        <form onSubmit={handleEmail} className="auth-form">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password (min 6 characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />
          <button type="submit" className="auth-submit" disabled={loading}>
            {loading ? 'Creating account…' : 'Create Account'}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account? <Link href="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
