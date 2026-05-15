import type { Metadata, Viewport } from "next";
import { Instrument_Serif, IBM_Plex_Mono } from "next/font/google";
import { ErrorBoundary } from "@/components/error-boundary";
import "./globals.css";

const display = Instrument_Serif({
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
  variable: "--font-display-loaded",
  display: "swap",
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-mono-loaded",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://spellhand.vercel.app"),
  title: {
    default: "Spellhand — A specimen catalogue of the ASL fingerspelling alphabet",
    template: "%s · Spellhand",
  },
  description:
    "Learn the American Sign Language fingerspelling alphabet with your camera. A specimen-by-specimen field guide, built mobile-first.",
  keywords: [
    "ASL",
    "American Sign Language",
    "fingerspelling",
    "alphabet",
    "learn ASL",
    "sign language trainer",
  ],
  openGraph: {
    title: "Spellhand",
    description:
      "A specimen catalogue of the ASL fingerspelling alphabet. Learn with your camera.",
    type: "website",
  },
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#1a1612",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${display.variable} ${mono.variable}`}>
      <body className="min-h-svh overflow-x-clip antialiased">
        <ErrorBoundary>{children}</ErrorBoundary>
      </body>
    </html>
  );
}
