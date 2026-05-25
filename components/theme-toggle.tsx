"use client";

import { useEffect, useState } from "react";
import { THEME_COOKIE, THEMES, type Theme } from "@/lib/theme";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
  // null until mounted — keeps the SSR markup stable (no hydration mismatch),
  // then resolves to the real active theme on the client.
  const [theme, setTheme] = useState<Theme | null>(null);

  useEffect(() => {
    // An explicit choice (server-rendered from the cookie) wins; otherwise
    // mirror the device preference so the active pill reflects what's on screen.
    const explicit = document.documentElement.dataset.theme;
    if (explicit === "light" || explicit === "dark") {
      setTheme(explicit);
    } else {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      setTheme(prefersDark ? "dark" : "light");
    }
  }, []);

  const apply = (next: Theme) => {
    setTheme(next);
    document.documentElement.dataset.theme = next;
    document.cookie = `${THEME_COOKIE}=${next};path=/;max-age=${60 * 60 * 24 * 365};samesite=lax`;
  };

  return (
    <span className={cn("caption inline-flex items-center gap-1", className)}>
      {THEMES.map((value, i) => {
        const active = value === theme;
        return (
          <span key={value} className="inline-flex items-center gap-1">
            {i > 0 ? <span aria-hidden className="text-bone-3">/</span> : null}
            <button
              type="button"
              onClick={() => {
                if (!active) apply(value);
              }}
              aria-pressed={active}
              className={cn(
                "uppercase transition-colors",
                active ? "text-acid" : "text-bone-3 hover:text-bone",
              )}
            >
              {value}
            </button>
          </span>
        );
      })}
    </span>
  );
}
