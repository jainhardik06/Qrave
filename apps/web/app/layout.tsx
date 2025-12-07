import './globals.css';
import { ReactNode } from 'react';

export const metadata = {
  title: 'Qrave Platform',
  description: 'Multi-tenant restaurant SaaS',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
