import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'For Her ❤️',
  description: 'A gentle medicine tracker made with love.'
};

export default function RootLayout({ children }: Readonly<{children: React.ReactNode}>) {
  return <html lang="en"><body>{children}</body></html>;
}
