"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { SpellhandMark } from "@/components/marks/spellhand-mark";

export function CertificateView({
  token,
  displayName,
  issuedAt,
}: {
  token: string;
  displayName: string;
  issuedAt: string;
}) {
  const dateLabel = new Date(issuedAt).toLocaleDateString("en-US", {
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
    const text = `I earned my Spellhand certificate — ASL fingerspelling alphabet, every letter from memory.`;
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
      "_blank",
    );
  };

  const downloadPng = async () => {
    if (downloading) return;
    setDownloading(true);
    try {
      const res = await fetch(`/cert/${token}/og`);
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
          <span className="caption-acid">CERTIFICATE</span>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-center px-4 py-10 sm:px-6 sm:py-16">
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="caption-acid"
        >
          AWARDED · {dateLabel.toUpperCase()}
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 16, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="mt-3 font-[family-name:var(--font-display-loaded)] text-4xl italic leading-[0.95] sm:text-6xl"
        >
          {displayName}
        </motion.h1>

        {/* The certificate */}
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 1.05, rotate: -1.5 }}
          animate={{ opacity: 1, y: 0, scale: 1, rotate: 0 }}
          transition={{ delay: 0.35, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="hairline relative mt-10 aspect-[4/3] w-full max-w-3xl bg-ink-2 p-4 sm:p-10"
        >
          <div className="hairline-soft absolute inset-2 sm:inset-5" aria-hidden />
          {[
            "left-2 top-2 sm:left-3 sm:top-3",
            "right-2 top-2 sm:right-3 sm:top-3",
            "left-2 bottom-2 sm:left-3 sm:bottom-3",
            "right-2 bottom-2 sm:right-3 sm:bottom-3",
          ].map((c) => (
            <span key={c} aria-hidden className={`absolute ${c} h-1.5 w-1.5 bg-acid`} />
          ))}
          <div className="relative flex h-full flex-col items-center justify-center px-2 text-center sm:px-0">
            <p className="caption-acid text-[10px] sm:text-xs">SPELLHAND</p>
            <p className="mt-2 font-[family-name:var(--font-display-loaded)] text-2xl italic leading-tight sm:mt-3 sm:text-5xl">
              Certificate of<br />Fingerspelling
            </p>
            <p className="caption mt-4 text-bone-3 sm:mt-6">awarded to</p>
            <p className="mt-1 font-[family-name:var(--font-display-loaded)] text-xl italic text-bone sm:text-3xl">
              {displayName}
            </p>
            <p className="caption mt-4 max-w-xs text-bone-3 sm:mt-6">
              for mastering the American Sign Language alphabet
            </p>
            <p className="caption mt-3 text-bone-3 sm:mt-4">{dateLabel}</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.5 }}
          className="mt-10 flex flex-wrap items-center justify-center gap-3 sm:gap-5"
        >
          <button
            onClick={downloadPng}
            disabled={downloading}
            className="hairline bg-ink px-6 py-3 font-mono text-sm transition-transform hover:-translate-y-px hover:bg-acid hover:text-ink disabled:opacity-50 disabled:hover:translate-y-0"
          >
            {downloading ? "GENERATING…" : "DOWNLOAD"}
          </button>
          <button
            onClick={copyLink}
            className="hairline bg-ink px-6 py-3 font-mono text-sm transition-transform hover:-translate-y-px hover:bg-acid hover:text-ink"
          >
            {copied ? "LINK COPIED ✓" : "COPY LINK"}
          </button>
          <button
            onClick={shareOnX}
            className="inline-flex items-center gap-3 bg-acid px-6 py-3 font-mono text-sm text-ink transition-transform hover:-translate-y-px"
          >
            SHARE ON X <span aria-hidden>→</span>
          </button>
          <Link href="/" className="caption hover:text-acid">
            ← Home
          </Link>
        </motion.div>
      </div>
    </main>
  );
}
