"use client";

import { useTransition } from "react";
import { useLocale } from "next-intl";
import { setLocale } from "@/app/_actions/locale";
import { LOCALES, type Locale } from "@/lib/i18n/config";
import { cn } from "@/lib/utils";

export function LocaleToggle({ className }: { className?: string }) {
  const current = useLocale() as Locale;
  const [pending, startTransition] = useTransition();

  return (
    <span className={cn("caption inline-flex items-center gap-1", className)}>
      {LOCALES.map((loc, i) => {
        const active = loc === current;
        return (
          <span key={loc} className="inline-flex items-center gap-1">
            {i > 0 ? <span aria-hidden className="text-bone-3">/</span> : null}
            <button
              type="button"
              onClick={() => {
                if (active || pending) return;
                startTransition(() => {
                  setLocale(loc);
                });
              }}
              aria-pressed={active}
              disabled={pending}
              className={cn(
                "uppercase transition-colors",
                active ? "text-acid" : "text-bone-3 hover:text-bone",
              )}
            >
              {loc}
            </button>
          </span>
        );
      })}
    </span>
  );
}
