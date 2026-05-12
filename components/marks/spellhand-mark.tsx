import { cn } from "@/lib/utils";

/**
 * Wordmark. Renders "Spellhand" with an italic serif S and mono trailing.
 * Use `compact` for tight headers (just an italic S).
 */
export function SpellhandMark({
  compact = false,
  className,
}: {
  compact?: boolean;
  className?: string;
}) {
  if (compact) {
    return (
      <span
        className={cn(
          "font-[family-name:var(--font-display-loaded)] italic text-[1.5rem] leading-none text-acid",
          className,
        )}
        aria-label="Spellhand"
      >
        S
      </span>
    );
  }
  return (
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
}
