import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://syntrixlabs.in"),
  title: {
    default: "Syntrix Labs | Websites, Apps, and Business Platforms",
    template: "%s | Syntrix Labs",
  },
  description: "Syntrix Labs builds custom websites, web apps, dashboards, APIs, booking flows, and digital platforms for startups and growing businesses.",
  alternates: {
    canonical: "https://syntrixlabs.in",
  },
  openGraph: {
    title: "Syntrix Labs | Websites, Apps, and Business Platforms",
    description: "Custom websites, apps, dashboards, APIs, and launch-ready business platforms.",
    url: "https://syntrixlabs.in",
    siteName: "Syntrix Labs",
    type: "website",
  },
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
