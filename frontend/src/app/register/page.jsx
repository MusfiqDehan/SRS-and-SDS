'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/components/Toast';
import { AuthShell, Field } from '../login/page';

export default function RegisterPage() {
  const { register } = useAuth();
  const { notify } = useToast();
  const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const user = await register(form);
      notify(`Account created. Welcome, ${user.name}!`, 'success');
      router.push(user.role === 'admin' ? '/admin' : '/docs/sds');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell title="Create account" subtitle="Register to manage documentation content">
      <form onSubmit={submit} className="space-y-4">
        <Field
          label="Full name"
          value={form.name}
          onChange={(v) => setForm({ ...form, name: v })}
          placeholder="Jane Doe"
          required
        />
        <Field
          label="Email"
          type="email"
          value={form.email}
          onChange={(v) => setForm({ ...form, email: v })}
          placeholder="you@example.com"
          required
        />
        <Field
          label="Password"
          type="password"
          value={form.password}
          onChange={(v) => setForm({ ...form, password: v })}
          placeholder="At least 8 characters"
          required
        />
        {error && <p className="text-sm font-medium text-red-500">{error}</p>}
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-lg bg-[var(--accent)] py-2.5 font-semibold text-white transition hover:bg-[var(--accent-hover)] disabled:opacity-60"
        >
          {busy ? 'Creating account…' : 'Create account'}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-[var(--muted)]">
        Already registered?{' '}
        <Link href="/login" className="font-semibold text-[var(--accent)]">
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
}
