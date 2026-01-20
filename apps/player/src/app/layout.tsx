import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'TruDigital Player',
  description: 'Digital signage display player',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
