import './globals.css';
import { Providers } from './providers';

export const metadata = {
  title: 'SDS / SRS Documentation Platform',
  description:
    'Create, manage and export Software Design Specification (SDS) and Software Requirements Specification (SRS) documents.',
  icons: { icon: '/favicon.ico' },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
