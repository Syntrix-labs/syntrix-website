import type { Metadata } from "next";
import "./globals.css";

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Syntrix Labs",
  url: "https://syntrixlabs.in",
  founder: [
    { "@type": "Person", name: "Soham" },
    { "@type": "Person", name: "Tahir" },
  ],
  description:
    "Syntrix Labs builds custom websites, web apps, dashboards, APIs, booking flows, and digital platforms for startups and growing businesses.",
  sameAs: ["https://github.com/Syntrix-labs/syntrix-website"],
  makesOffer: [
    {
      "@type": "Offer",
      itemOffered: {
        "@type": "Service",
        name: "Website development",
        serviceType: "Custom website development",
      },
    },
    {
      "@type": "Offer",
      itemOffered: {
        "@type": "Service",
        name: "Web application development",
        serviceType: "Dashboards, portals, and business platforms",
      },
    },
    {
      "@type": "Offer",
      itemOffered: {
        "@type": "Service",
        name: "Booking and automation systems",
        serviceType: "Business process automation and meeting workflows",
      },
    },
  ],
};

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
      <body className="min-h-full flex flex-col">
        {children}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
      </body>
    </html>
  );
}
