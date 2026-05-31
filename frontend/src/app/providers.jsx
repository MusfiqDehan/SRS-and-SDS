'use client';

import { ThemeProvider } from '@/lib/theme';
import { AuthProvider } from '@/lib/auth';
import { ToastProvider } from '@/components/Toast';

export function Providers({ children }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>{children}</ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
