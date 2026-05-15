import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * Wordmark. Renders "Spellhand" with an italic serif S and mono trailing.
 * Pass `href` to make it a clickable link (e.g. back to home).
 */
export function SpellhandMark({
  compact = false,
  className,
  href,
}: {
  compact?: boolean;
  className?: string;
  href?: string;
}) {
  const content = compact ? (
    <span
      className={cn(
        "font-[family-name:var(--font-display-loaded)] italic text-[1.5rem] leading-none text-acid",
        className,
      )}
      aria-label="Spellhand"
    >
      S
    </span>
  ) : (
    <span
      className={cn("inline-flex items-baseline gap-[0.08em] leading-none", className)}
      aria-label="Spellhand"
    >
      <span className="font-[family-name:var(--font-display-loaded)] italic text-[1.6em] text-acid">
        S
      </span>
      <span className="font-mono text-[0.9em] tracking-[0.05em] text-bone">
        pellhand
      </span>
    </span>
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex items-baseline transition-opacity hover:opacity-80">
        {content}
      </Link>
    );
  }
  return content;
}
