import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css';
import { AuthProvider } from '../components/AuthProvider';

export const metadata: Metadata = {
  title: 'Panda Studio',
  description: 'Role-aware production and crew management for Panda Studio.',
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-[#f2eadf] text-black antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}