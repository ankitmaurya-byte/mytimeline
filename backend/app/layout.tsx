import type { Metadata } from 'next';
import { ThemeProvider } from './contexts/ThemeContext';
import './globals.css';

export const metadata: Metadata = {
  title: 'Timeline Backend Dashboarddd',
  description: 'Backend system monitoring and administration dashboard',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}