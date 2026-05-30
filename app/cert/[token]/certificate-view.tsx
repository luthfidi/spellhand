"use client";

import { useState } from "react";
import Link from "next/link";
import { m } from "motion/react";
import { useLocale, useTranslations } from "next-intl";
import { SpellhandMark } from "@/components/marks/spellhand-mark";
import { CertificateCard } from "@/components/certificate/certificate-card";

export function CertificateView({
  token,
  displayName,
  issuedAt,
}: {
  token: string;
  displayName: string;
  issuedAt: string;
}) {
  const t = useTranslations("cert");
  const locale = useLocale();
  const dateLabel = new Date(issuedAt).toLocaleDateString(locale === "id" ? "id-ID" : "en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const copyLink = async () => {
    try {
      const url = `${window.location.origin}/cert/${token}`;
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  const shareOnX = () => {
    const url = `${window.location.origin}/cert/${token}`;
    const text = t("share_text");
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
      "_blank",
    );
  };

  const downloadPng = async () => {
    if (downloading) return;
    setDownloading(true);
    try {
      const res = await fetch(`/cert/${token}/og?lang=${locale}&format=download`);
      if (!res.ok) throw new Error("Failed to generate image");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `spellhand-${displayName.trim().replace(/\s+/g, "-").toLowerCase()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <main className="flex min-h-svh flex-col bg-ink">
      <header className="ruled-b">
        <div className="mx-auto flex h-12 max-w-6xl items-center justify-between px-4 sm:px-6">
          <SpellhandMark href="/" />
          <span className="caption-acid">{t("header")}</span>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-center px-4 py-4 sm:px-6 sm:py-8">
        <m.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="caption-acid"
        >
          {t("awarded_on", { date: dateLabel.toUpperCase() })}
        </m.p>

        <m.h1
          initial={{ opacity: 0, y: 16, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="mt-2 font-[family-name:var(--font-display-loaded)] text-2xl italic leading-[0.95] sm:text-4xl"
        >
          {displayName}
        </m.h1>

        {/* The certificate — shared design, mirrored by the downloadable PNG.
            max-w-xl on desktop keeps the whole page (header + cert + actions)
            in-viewport on ~768h laptops so the download button is reachable
            without scrolling. */}
        <m.div
          initial={{ opacity: 0, y: 24, scale: 1.05, rotate: -1.5 }}
          animate={{ opacity: 1, y: 0, scale: 1, rotate: 0 }}
          transition={{ delay: 0.35, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="mt-5 w-full max-w-xl"
        >
          <CertificateCard name={displayName} dateLabel={dateLabel} />
        </m.div>

        <m.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.5 }}
          className="mt-6 flex flex-wrap items-center justify-center gap-3 sm:gap-4"
        >
          <button
            onClick={downloadPng}
            disabled={downloading}
            className="hairline bg-ink px-6 py-3 font-mono text-sm transition-transform hover:-translate-y-px hover:bg-acid hover:text-ink disabled:opacity-50 disabled:hover:translate-y-0"
          >
            {downloading ? t("download_busy") : t("download_idle")}
          </button>
          <button
            onClick={copyLink}
            className="hairline bg-ink px-6 py-3 font-mono text-sm transition-transform hover:-translate-y-px hover:bg-acid hover:text-ink"
          >
            {copied ? t("copy_done") : t("copy_idle")}
          </button>
          <button
            onClick={shareOnX}
            className="inline-flex items-center gap-3 bg-acid px-6 py-3 font-mono text-sm text-ink transition-transform hover:-translate-y-px"
          >
            {t("share_x")} <span aria-hidden>→</span>
          </button>
          <Link href="/" className="caption hover:text-acid">
            {t("home")}
          </Link>
        </m.div>
      </div>
    </main>
  );
}
