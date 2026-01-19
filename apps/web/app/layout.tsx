import './globals.css';
import { ReactNode } from 'react';

export const metadata = {
  title: 'Qrave Platform',
  description: 'Multi-tenant restaurant SaaS',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-surface text-gray-900 font-sans">{children}</body>
    </html>
  );
}
