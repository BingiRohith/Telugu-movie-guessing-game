import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Telugu Dialogue Battle',
  description: 'A Telugu cinema quiz with music, dialogues, and songs.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
