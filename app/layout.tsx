import type { Metadata } from "next";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { Inter, Newsreader } from "next/font/google";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const newsreader = Newsreader({ subsets: ["latin"], variable: "--font-serif", style: ["normal", "italic"] });

export const metadata: Metadata = {
  title: "Talent Matcher",
  description: "AI-powered candidate matching and ranking",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en" className={`${inter.variable} ${newsreader.variable}`}>
        <body className="min-h-screen antialiased bg-white text-neutral-900 font-sans">{children}</body>
      </html>
    </ClerkProvider>
  );
}
