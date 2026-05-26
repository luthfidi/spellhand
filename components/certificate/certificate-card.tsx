"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

const CORNERS = [
  "left-2 top-2 sm:left-3 sm:top-3",
  "right-2 top-2 sm:right-3 sm:top-3",
  "left-2 bottom-2 sm:left-3 sm:bottom-3",
  "right-2 bottom-2 sm:right-3 sm:bottom-3",
];

/**
 * The single source of truth for the certificate's visual design — used by the
 * cert page, the landing-page preview, and the challenge "earned" preview, and
 * mirrored by the downloadable PNG in `app/cert/[token]/og/route.tsx`.
 *
 * `data-theme="dark"` pins it to the branded palette regardless of the page
 * theme: a certificate is a fixed artifact, and this keeps the on-screen card
 * matching the downloaded image (which is always dark) in light mode too.
 *
 * 4:3 by design. The caller supplies the entrance animation by wrapping this.
 */
export function CertificateCard({
  name,
  dateLabel,
  nameDim = false,
  className,
}: {
  name: string;
  /** Omit on placeholder previews (landing / challenge) — hides the date line. */
  dateLabel?: string;
  /** Dim the name (used for the landing placeholder, not a real recipient). */
  nameDim?: boolean;
  className?: string;
}) {
  const t = useTranslations("cert");
  return (
    <div
      data-theme="dark"
      className={cn(
        "hairline relative aspect-[4/3] w-full bg-ink-2 p-4 sm:p-10",
        className,
      )}
    >
      <div className="hairline-soft absolute inset-2 sm:inset-5" aria-hidden />
      {CORNERS.map((c) => (
        <span key={c} aria-hidden className={`absolute ${c} h-1.5 w-1.5 bg-acid`} />
      ))}
      <div className="relative flex h-full flex-col items-center justify-center px-2 text-center sm:px-0">
        <p className="caption-acid text-[10px] sm:text-xs">{t("brand")}</p>
        <p className="mt-2 font-[family-name:var(--font-display-loaded)] text-2xl italic leading-tight sm:mt-3 sm:text-5xl">
          {t("title_line_1")}
          <br />
          {t("title_line_2")}
        </p>
        <p className="caption mt-4 text-bone-3 sm:mt-6">{t("awarded_to")}</p>
        <p
          className={cn(
            "mt-1 font-[family-name:var(--font-display-loaded)] text-xl italic sm:text-3xl",
            nameDim ? "text-bone-2" : "text-bone",
          )}
        >
          {name}
        </p>
        <p className="caption mt-4 max-w-xs text-bone-3 sm:mt-6">{t("subtitle")}</p>
        {dateLabel ? (
          <p className="caption mt-3 text-bone-3 sm:mt-4">{dateLabel}</p>
        ) : null}
      </div>
    </div>
  );
}
