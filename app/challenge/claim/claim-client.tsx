"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "motion/react";
import { useTranslations } from "next-intl";
import { issueCertificate } from "@/app/_actions/cert";
import { SpellhandMark } from "@/components/marks/spellhand-mark";

type Status = "issuing" | "error" | "missing-name";

export function ClaimClient({ displayName }: { displayName: string }) {
  const t = useTranslations("claim");
  const router = useRouter();
  const [status, setStatus] = useState<Status>(
    displayName ? "issuing" : "missing-name",
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!displayName) return;
    let cancelled = false;
    (async () => {
      const result = await issueCertificate(displayName);
      if (cancelled) return;
      if ("share_token" in result) {
        router.replace(`/cert/${result.share_token}`);
      } else {
        setError(result.error);
        setStatus("error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [displayName, router]);

  return (
    <main className="flex min-h-svh flex-col bg-ink">
      <header className="ruled-b">
        <div className="mx-auto flex h-12 max-w-6xl items-center justify-between px-4 sm:px-6">
          <SpellhandMark href="/" />
          <span className="caption-acid">{t("header")}</span>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-4 py-12 text-center sm:px-6">
        {status === "issuing" ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col items-center gap-4"
          >
            <p className="caption-acid">{t("issuing_eyebrow")}</p>
            <p className="font-[family-name:var(--font-display-loaded)] text-4xl italic leading-tight sm:text-5xl">
              {t("issuing_title")}
            </p>
            <div className="mt-2 h-[2px] w-40 overflow-hidden bg-rule">
              <div className="h-full w-1/3 animate-sweep bg-acid" />
            </div>
          </motion.div>
        ) : null}

        {status === "missing-name" ? (
          <div className="flex flex-col items-center gap-4">
            <p className="caption text-blood">{t("missing_eyebrow")}</p>
            <p className="font-[family-name:var(--font-display-loaded)] text-3xl italic">
              {t("missing_title")}
            </p>
            <p className="font-mono text-sm text-bone-2">
              {t("missing_body")}
            </p>
            <Link
              href="/"
              className="mt-4 inline-flex items-center gap-3 bg-acid px-5 py-3 font-mono text-sm text-ink"
            >
              {t("back_home")}
            </Link>
          </div>
        ) : null}

        {status === "error" ? (
          <div className="flex flex-col items-center gap-4">
            <p className="caption text-blood">{t("error_eyebrow")}</p>
            <p className="font-[family-name:var(--font-display-loaded)] text-3xl italic">
              {t("error_title")}
            </p>
            <p className="font-mono text-sm text-bone-2">{error}</p>
            <Link
              href="/"
              className="mt-4 inline-flex items-center gap-3 bg-acid px-5 py-3 font-mono text-sm text-ink"
            >
              {t("back_home")}
            </Link>
          </div>
        ) : null}
      </div>
    </main>
  );
}
