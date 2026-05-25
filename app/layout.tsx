import type { Metadata, Viewport } from "next";
import { Instrument_Serif, IBM_Plex_Mono } from "next/font/google";
import { cookies } from "next/headers";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages, getTranslations } from "next-intl/server";
import { THEME_COOKIE, isTheme } from "@/lib/theme";
import { ErrorBoundary } from "@/components/error-boundary";
import { MotionProvider } from "@/components/motion-provider";
import { ServiceWorkerRegister } from "@/components/service-worker-register";
import "./globals.css";

const display = Instrument_Serif({
  subsets: ["latin"],
  weight: ["400"],
  style: ["italic"],
  variable: "--font-display-loaded",
  display: "swap",
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  style: ["normal"],
  variable: "--font-mono-loaded",
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("metadata");
  return {
    metadataBase: new URL("https://spellhand.vercel.app"),
    title: {
      default: t("title_default"),
      template: t("title_template"),
    },
    description: t("description"),
    keywords: [
      "ASL",
      "American Sign Language",
      "fingerspelling",
      "alphabet",
      "learn ASL",
      "sign language trainer",
    ],
    openGraph: {
      title: t("og_title"),
      description: t("og_description"),
      type: "website",
    },
    icons: {
      icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    },
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#1a1612" },
    { media: "(prefers-color-scheme: light)", color: "#f5f0e6" },
  ],
  colorScheme: "light dark",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const messages = await getMessages();
  const themeCookie = (await cookies()).get(THEME_COOKIE)?.value;
  const theme = isTheme(themeCookie) ? themeCookie : undefined;

  return (
    <html
      lang={locale}
      className={`${display.variable} ${mono.variable}`}
      data-theme={theme}
    >
      <head>
        {/* MediaPipe model + WASM live on these CDNs. Establishing the TLS
            handshake early shaves ~100–300ms off the first /play visit. */}
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://storage.googleapis.com" crossOrigin="anonymous" />
      </head>
      <body className="min-h-svh overflow-x-clip antialiased">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <MotionProvider>
            <ErrorBoundary>{children}</ErrorBoundary>
          </MotionProvider>
        </NextIntlClientProvider>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
