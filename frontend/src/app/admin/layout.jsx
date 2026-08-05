'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Icon } from '@/components/icons';

export default function AdminLayout({ children }) {
  const { user, loading, isAdmin, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
    else if (!loading && user && !isAdmin) router.replace('/docs/sds');
  }, [loading, user, isAdmin, router]);

  if (loading || !user || !isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--bg)] text-[var(--muted)]">
        Checking access…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--surface)]/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
          <Link href="/admin" className="flex items-center gap-2 font-bold">
            <Icon.Doc className="h-6 w-6 text-[var(--accent)]" />
            Admin Dashboard
          </Link>
          <div className="ml-auto flex items-center gap-2">
            <Link
              href="/docs/sds"
              className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm font-semibold hover:border-[var(--accent)]"
            >
              View site
            </Link>
            <span className="hidden text-sm text-[var(--muted)] sm:inline">{user.email}</span>
            <ThemeToggle />
            <button
              type="button"
              onClick={() => {
                logout();
                router.push('/login');
              }}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border)]"
              aria-label="Log out"
            >
              <Icon.Logout className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
