import type {Metadata} from 'next';
import './globals.css'; // Global styles

export const metadata: Metadata = {
  title: 'Accounta - AI Habit Tracker',
  description: 'AI-powered Habit Tracker and Brutal Accountability Partner',
  icons: {
    icon: [
      { url: '/Accounta-Logo-smaller_symvol.png', type: 'image/png' },
    ],
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
