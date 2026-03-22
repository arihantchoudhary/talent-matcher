import type { Metadata } from "next";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { Geist } from "next/font/google";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "Talent Matcher",
  description: "AI-powered candidate matching and ranking",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en" className={geist.variable}>
        <body className="min-h-screen antialiased bg-zinc-50 text-zinc-900 font-sans">{children}</body>
      </html>
    </ClerkProvider>
  );
}
