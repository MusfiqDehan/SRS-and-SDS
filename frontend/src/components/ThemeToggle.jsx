'use client';

import { useTheme } from '@/lib/theme';
import { Icon } from './icons';

export function ThemeToggle({ className = '' }) {
  const { theme, toggleTheme } = useTheme();
  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label="Toggle theme"
      className={`inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] transition hover:border-[var(--accent)] ${className}`}
    >
      {theme === 'dark' ? <Icon.Sun className="h-5 w-5" /> : <Icon.Moon className="h-5 w-5" />}
    </button>
  );
}
