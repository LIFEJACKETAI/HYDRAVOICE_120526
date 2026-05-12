import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "next-themes";
import { QueryClientProvider } from "@/components/query-provider";
import { AuthProvider } from "@/components/auth-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Hydravoice - Transform Documents Into Audiobooks",
  description:
    "Upload any PDF, TXT, or DOCX file and convert it to natural-sounding audio with 20+ premium voices. Listen anywhere, anytime.",
  keywords: [
    "Hydravoice",
    "audiobook",
    "text to speech",
    "document conversion",
    "voice",
    "PDF to audio",
  ],
  authors: [{ name: "Hydravoice Team" }],
  icons: {
    icon: "/hydravoice-logo.png",
  },
  openGraph: {
    title: "Hydravoice - Transform Documents Into Audiobooks",
    description: "Convert your documents to natural-sounding audio with 20+ premium voices",
    siteName: "Hydravoice",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Hydravoice - Transform Documents Into Audiobooks",
    description: "Convert your documents to natural-sounding audio with 20+ premium voices",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="dark">
      <head></head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          <AuthProvider>
            <QueryClientProvider>
              {children}
              <Toaster />
            </QueryClientProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
