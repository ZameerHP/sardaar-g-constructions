import type { Metadata } from "next";
import { Barlow_Condensed, Plus_Jakarta_Sans } from "next/font/google";
import { siteOrigin } from "@/lib/supabase/config";
import { getContent } from "@/lib/content";
import "./globals.css";
import "./public-premium.css";

const barlowCondensed = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["700", "800"],
  display: "swap",
  variable: "--font-cond",
});

const jakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
  variable: "--font-sans",
});

const defaultTitle =
  "Exterior Cladding & Siding Contractor BC | Sardaar G Construction";
const defaultDescription =
  "Professional exterior cladding, rainscreen assemblies, and siding installation for multi-family, commercial, and residential projects across British Columbia.";

export const metadata: Metadata = {
  metadataBase: new URL(siteOrigin()),
  title: defaultTitle,
  description: defaultDescription,
  icons: { icon: "/favicon.svg" },
  alternates: { canonical: "/" },
  robots: {
    index: process.env.SITE_INDEXABLE !== "false",
    follow: process.env.SITE_INDEXABLE !== "false",
  },
  openGraph: {
    type: "website",
    siteName: "Sardaar G Construction Ltd.",
    title: defaultTitle,
    description: defaultDescription,
    url: "/",
    locale: "en_CA",
    images: [
      {
        url: "/images/hero-foreground.webp",
        width: 1536,
        height: 1024,
        alt: "Sardaar G Construction Ltd. — Exterior Cladding & Siding Contractor in British Columbia",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: defaultTitle,
    description: defaultDescription,
    images: ["/images/hero-foreground.webp"],
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
    "@type": ["LocalBusiness", "GeneralContractor", "HomeAndConstructionBusiness"],
    name: "Sardaar G Construction Ltd.",
    url: siteOrigin(),
    image: `${siteOrigin()}/images/hero-foreground.webp`,
    logo: `${siteOrigin()}/images/logo-mark.webp`,
    description: defaultDescription,
    areaServed: settings.service_area || "British Columbia, Canada",
    telephone: "+1-778-681-1313",
    email: "info@sardaarg.ca",
    address: settings.address
      ? {
          "@type": "PostalAddress",
          streetAddress: settings.address,
          addressRegion: "BC",
          addressCountry: "CA",
        }
      : {
          "@type": "PostalAddress",
          addressRegion: "BC",
          addressCountry: "CA",
        },
    sameAs: [
      settings.instagram || "https://www.instagram.com/sardaarg_ltd/",
    ],
  };

  return (
    <html
      lang="en"
      className={`${barlowCondensed.variable} ${jakartaSans.variable}`}
    >
      <head>
        <meta charSet="utf-8" />
      </head>
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
