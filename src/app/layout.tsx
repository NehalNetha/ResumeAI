import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import DashboardSidebar from "@/components/DashboardSidebar";
import { SpeedInsights } from "@vercel/speed-insights/next"
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});


export const metadata: Metadata = {
  title: "ResumeRaft - AI-Powered Resume Builder",
  description: "Create professional resumes with AI assistance. Customize templates and get instant feedback to land your dream job.",
  keywords: ["resume builder", "AI resume", "professional resume", "CV builder"],
  authors: [{ name: "ResumeRaft Team" }],
  creator: "ResumeRaft",
  icons: {
    icon: "/l.png",
    apple: "/logo.png",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    title: "ResumeRaft - AI-Powered Resume Builder",
    description: "Create professional resumes with AI assistance. Customize templates and get instant feedback to land your dream job.",
    siteName: "ResumeRaft",
    images: [
      {
        url: "/logo.png",
        width: 512,
        height: 512,
        alt: "ResumeRaft Logo",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >

        {children}
        <SpeedInsights />

      </body>
    </html>
  );
}
