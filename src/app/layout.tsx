import type { Metadata, Viewport } from "next";
import { Anton, Poppins } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { MobileBottomNav } from "@/components/MobileBottomNav";

const display = Anton({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-display",
  display: "swap",
});

const body = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.tehrititans.in"),
  title: {
    default: "Tehri Titans — Official T20 Franchise | Uttarakhand Premier League (UPL)",
    template: "%s · Tehri Titans UPL",
  },
  description:
    "Official website of Tehri Titans — professional T20 cricket franchise representing Tehri Garhwal in the Uttarakhand Premier League (UPL). Register for open trials & Ayush Cricket Academy pathway.",
  keywords: [
    "Tehri Titans",
    "Tehri Titans UPL",
    "Uttarakhand Premier League",
    "UPL T20",
    "Tehri Garhwal Cricket",
    "Ayush Cricket Academy",
    "Cricket Trials Uttarakhand",
    "UPL Franchise",
    "tehrititans.in",
    "www.tehrititans.in",
  ],
  authors: [{ name: "Tehri Titans Franchise", url: "https://www.tehrititans.in" }],
  alternates: {
    canonical: "https://www.tehrititans.in",
  },
  icons: {
    icon: [
      { url: "/tehri-titans-logo.png", type: "image/png" },
    ],
    shortcut: "/tehri-titans-logo.png",
    apple: "/tehri-titans-logo.png",
  },
  openGraph: {
    title: "Tehri Titans — Uttarakhand Premier League (UPL) T20 Franchise",
    description:
      "Official T20 franchise representing Tehri Garhwal in the Uttarakhand Premier League. Register for Open Trials at Ayush Cricket Academy.",
    url: "https://www.tehrititans.in",
    siteName: "Tehri Titans",
    images: [
      {
        url: "https://www.tehrititans.in/tehri-titans-logo.png",
        width: 1200,
        height: 1200,
        alt: "Tehri Titans Official Crest",
      },
    ],
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Tehri Titans — Uttarakhand Premier League T20 Franchise",
    description:
      "Official website of Tehri Titans T20 Franchise in the Uttarakhand Premier League.",
    images: ["https://www.tehrititans.in/tehri-titans-logo.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#01072F",
  width: "device-width",
  initialScale: 1,
};

const jsonLdSchema = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "SportsTeam",
      "@id": "https://www.tehrititans.in/#team",
      "name": "Tehri Titans",
      "sport": "Cricket",
      "url": "https://www.tehrititans.in",
      "logo": "https://www.tehrititans.in/tehri-titans-logo.png",
      "image": "https://www.tehrititans.in/tehri-titans-logo.png",
      "description": "Official T20 cricket franchise representing Tehri Garhwal in the Uttarakhand Premier League (UPL).",
      "memberOf": {
        "@type": "SportsOrganization",
        "name": "Uttarakhand Premier League",
        "alternateName": "UPL"
      },
      "location": {
        "@type": "Place",
        "name": "Tehri Garhwal",
        "address": {
          "@type": "PostalAddress",
          "addressRegion": "Uttarakhand",
          "addressCountry": "IN"
        }
      }
    },
    {
      "@type": "SportsEvent",
      "name": "Tehri Titans Open Trials",
      "description": "Official player trials for Tehri Titans T20 Franchise in the Uttarakhand Premier League.",
      "startDate": "2026-08-24T09:00:00+05:30",
      "endDate": "2026-08-25T17:00:00+05:30",
      "eventStatus": "https://schema.org/EventScheduled",
      "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
      "location": {
        "@type": "Place",
        "name": "Ayush Cricket Academy",
        "address": {
          "@type": "PostalAddress",
          "streetAddress": "Chidderwala, Kansrao",
          "addressLocality": "Dehradun / Tehri Garhwal",
          "addressRegion": "Uttarakhand",
          "postalCode": "249204",
          "addressCountry": "IN"
        }
      },
      "organizer": {
        "@type": "SportsTeam",
        "name": "Tehri Titans",
        "url": "https://www.tehrititans.in"
      },
      "offers": {
        "@type": "Offer",
        "price": "999",
        "priceCurrency": "INR",
        "availability": "https://schema.org/InStock",
        "url": "https://www.tehrititans.in/#trials"
      }
    }
  ]
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <head>
        <link rel="icon" href="/tehri-titans-logo.png" type="image/png" />
        <link rel="apple-touch-icon" href="/tehri-titans-logo.png" />
        <Script
          id="json-ld-schema"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdSchema) }}
        />
        <Script
          src="https://sdk.cashfree.com/js/v3/cashfree.js"
          strategy="afterInteractive"
        />
      </head>
      <body className="min-h-screen overflow-x-hidden">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-lime-500 focus:px-4 focus:py-2 focus:font-semibold focus:text-navy-900"
        >
          Skip to content
        </a>
        <Header />
        <main id="main">{children}</main>
        <Footer />
        <MobileBottomNav />
      </body>
    </html>
  );
}
