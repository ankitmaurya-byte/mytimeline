import type { Metadata, Viewport } from "next";
import ReactQueryProvider from "@/context/query/ReactQueryProvider";
import { Toaster } from "@/components/ui/toaster";
import "./globals.css";
import { SearchParamsSuspense } from "@/components/suspense-wrapper";
import { DM_Sans } from "next/font/google";
import { ThemeProvider } from "@/context/theme-context";
import { MicrosoftClarity } from "@/components/analytics/MicrosoftClarity";
// import { PerformanceMonitor } from "@/components/performance/PerformanceMonitor";
// import { NavigationTimer } from "@/components/performance/NavigationTimer";
// import { AdvancedLogViewer } from "@/components/debug/AdvancedLogViewer";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: 'swap', // Optimize font loading
  preload: true, // Explicitly enable preloading
});

export const metadata: Metadata = {
  title: "Timeline - Project Management & Collaboration",
  description: "Modern project management platform with kanban boards, team collaboration, and timeline tracking. Boost productivity with Timeline.",
  keywords: ["project management", "kanban", "timeline", "collaboration", "productivity", "task management"],
  authors: [{ name: "Timeline Team" }],
  creator: "Timeline",
  publisher: "Timeline",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: [
      { url: "https://res.cloudinary.com/dsuafua4l/image/upload/v1758283871/timeline/frontend/public/--/frontend/public/favicon-svg/favicon.svg", sizes: "16x16", type: "image/svg+xml" },
      { url: "https://res.cloudinary.com/dsuafua4l/image/upload/v1758283871/timeline/frontend/public/--/frontend/public/favicon-svg/favicon.svg", sizes: "32x32", type: "image/svg+xml" },
      { url: "https://res.cloudinary.com/dsuafua4l/image/upload/v1758283871/timeline/frontend/public/--/frontend/public/favicon-svg/favicon.svg", type: "image/svg+xml" }
    ],
    apple: [
      { url: "https://res.cloudinary.com/dsuafua4l/image/upload/v1758264239/timeline/apple-touch-icon.png", sizes: "192x192", type: "image/png" }
    ],
    shortcut: "https://res.cloudinary.com/dsuafua4l/image/upload/v1758283871/timeline/frontend/public/--/frontend/public/favicon-svg/favicon.svg"
  },
  manifest: "/site.webmanifest",
  openGraph: {
    type: "website",
    title: "Timeline - Project Management & Collaboration",
    description: "Modern project management platform with kanban boards, team collaboration, and timeline tracking.",
    siteName: "Timeline"
  },
  twitter: {
    card: "summary_large_image",
    title: "Timeline - Project Management & Collaboration",
    description: "Modern project management platform with kanban boards, team collaboration, and timeline tracking."
  }
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover', // Enable safe area support for mobile devices
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Preload critical resources */}
        {/* Blocking script to prevent flash of unstyled content (FOUC) */}
        <script
          suppressHydrationWarning={true}
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const theme = localStorage.getItem('theme') || 'system';
                const root = document.documentElement;
                
                if (theme === 'dark') {
                  root.classList.add('dark');
                } else if (theme === 'light') {
                  root.classList.add('light');
                } else {
                  // system theme
                  const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  root.classList.add(isDark ? 'dark' : 'light');
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body suppressHydrationWarning={true} style={{ fontFamily: 'var(--font-dm-sans), serif' }} className={`relative min-h-screen ${dmSans.variable}`}>
        <MicrosoftClarity />
        <ThemeProvider>
          <ReactQueryProvider>
            <div className="relative w-full min-h-screen">
              <SearchParamsSuspense>
                {children}
              </SearchParamsSuspense>
              <Toaster />
            </div>
          </ReactQueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
