import type { Metadata } from "next";
import "./globals.css";
import { Geist } from "next/font/google";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "Talent Matcher — Founding GTM, Legal",
  description: "AI-powered candidate matching and ranking",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={geist.variable}>
      <body className="min-h-screen antialiased bg-white text-zinc-900 font-sans">
        {children}
      </body>
    </html>
  );
}
