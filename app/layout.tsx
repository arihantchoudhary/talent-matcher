import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Talent Matcher",
  description: "Upload candidates, match to roles, export your shortlist",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
