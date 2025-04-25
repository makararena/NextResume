import { Toaster } from "@/components/ui/toaster";
import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import { ThemeProvider } from "next-themes";
import { Inter } from "next/font/google";
import { Toaster as SonnerToaster } from "sonner";
import "./globals.css";
import "../styles/print.css";
import ClientErrorBoundary from "@/components/ClientErrorBoundary";
import DevTools from "@/components/test/DevTools";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    template: "%s - NextResume",
    absolute: "NextResume",
  },
  description:
    "NextResume is the easiest way to create a professional resume that will help you land your dream job.",
  icons: {
    icon: [
      { url: '/assets/NR-Icon.ico' }
    ]
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      // For secure cookie settings, we rely on the middleware.ts configuration
      // which already configures httpOnly, secure, and sameSite settings
      appearance={{
        baseTheme: undefined, // Use system theme
      }}
    >
      <html lang="en" suppressHydrationWarning>
        <head>
          <link rel="icon" href="/assets/NR-Icon.ico" />
        </head>
        <body className={inter.className}>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <ClientErrorBoundary>
              {children}
            </ClientErrorBoundary>
            <Toaster />
            <SonnerToaster position="top-right" />
            <DevTools />
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
