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
  metadataBase: new URL("https://tehrititans.example"),
  title: {
    default: "Tehri Titans — Uttarakhand Premier League",
    template: "%s · Tehri Titans",
  },
  description:
    "Tehri Titans — professional T20 franchise from Tehri Garhwal competing in the Uttarakhand Premier League. Squad, the UPL, and the Ayush Cricket Academy pathway.",
  openGraph: {
    title: "Tehri Titans — Uttarakhand Premier League",
    description:
      "Professional T20 franchise from Tehri Garhwal, competing in the Uttarakhand Premier League.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <head>
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
