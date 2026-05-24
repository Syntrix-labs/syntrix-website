import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Syntrix Labs",
  description: "Modern web, app, and business platform solutions from Syntrix Labs.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
