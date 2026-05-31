'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/components/Toast';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Icon } from '@/components/icons';

export default function LoginPage() {
  const { login } = useAuth();
  const { notify } = useToast();
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const user = await login(form);
      notify(`Welcome back, ${user.name}!`, 'success');
      router.push(user.role === 'admin' ? '/admin' : '/docs/sds');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell title="Sign in" subtitle="Access your documentation dashboard">
      <form onSubmit={submit} className="space-y-4">
        <Field
          label="Email"
          type="email"
          value={form.email}
          onChange={(v) => setForm({ ...form, email: v })}
          placeholder="admin@example.com"
          required
        />
        <Field
          label="Password"
          type="password"
          value={form.password}
          onChange={(v) => setForm({ ...form, password: v })}
          placeholder="••••••••"
          required
        />
        {error && <p className="text-sm font-medium text-red-500">{error}</p>}
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-lg bg-[var(--accent)] py-2.5 font-semibold text-white transition hover:bg-[var(--accent-hover)] disabled:opacity-60"
        >
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-[var(--muted)]">
        No account?{' '}
        <Link href="/register" className="font-semibold text-[var(--accent)]">
          Create one
        </Link>
      </p>
    </AuthShell>
  );
}

export function AuthShell({ title, subtitle, children }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--bg)] px-4 py-10 text-[var(--text)]">
      <div className="absolute right-4 top-4 flex items-center gap-2">
        <Link href="/docs/sds" className="text-sm font-semibold text-[var(--muted)] hover:text-[var(--text)]">
          ← Back to docs
        </Link>
        <ThemeToggle />
      </div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8 shadow-xl"
      >
        <div className="mb-6 flex items-center gap-2">
          <Icon.Doc className="h-8 w-8 text-[var(--accent)]" />
          <span className="text-lg font-bold">SDS / SRS Platform</span>
        </div>
        <h1 className="text-2xl font-extrabold">{title}</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">{subtitle}</p>
        <div className="mt-6">{children}</div>
      </motion.div>
    </div>
  );
}

export function Field({ label, type = 'text', value, onChange, placeholder, required }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium">{label}</span>
      <input
        type={type}
        value={value}
        required={required}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2.5 outline-none transition focus:border-[var(--accent)]"
      />
    </label>
  );
}
