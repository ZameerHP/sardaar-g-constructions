import type { Metadata } from "next";
import { siteOrigin } from "@/lib/supabase/config";
import { getContent } from "@/lib/content";
import "./globals.css";
export const metadata: Metadata = {
  metadataBase: new URL(siteOrigin()),
  title: "Exterior Cladding & Siding Contractor BC | Sardaar G Construction",
  description:
    "Professional exterior cladding and siding installation for multi-family, commercial and residential projects across British Columbia.",
  icons: { icon: "/favicon.svg" },
  robots: {
    index: process.env.SITE_INDEXABLE === "true",
    follow: process.env.SITE_INDEXABLE === "true",
  },
  openGraph: {
    type: "website",
    siteName: "Sardaar G Construction Ltd.",
    locale: "en_CA",
  },
};
export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { settings } = await getContent();
  const structured = {
    "@context": "https://schema.org",
    "@type": "HomeAndConstructionBusiness",
    name: "Sardaar G Construction Ltd.",
    url: siteOrigin(),
    areaServed: settings.service_area || "British Columbia, Canada",
    telephone: settings.phone || undefined,
    email: settings.email || undefined,
    address: settings.address || undefined,
    sameAs: settings.instagram ? [settings.instagram] : [],
  };
  return (
    <html lang="en">
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structured).replace(/</g, "\\u003c"),
          }}
        />
        {children}
      </body>
    </html>
  );
}
