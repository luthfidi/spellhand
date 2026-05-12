import { cn } from "@/lib/utils";

/**
 * Large display of a single letter glyph in Instrument Serif italic.
 * Used in specimen cards, the play page hero, etc.
 */
export function LetterGlyph({
  letter,
  className,
  italic = true,
  size = "lg",
}: {
  letter: string;
  className?: string;
  italic?: boolean;
  size?: "sm" | "md" | "lg" | "xl";
}) {
  const sizes = {
    sm: "text-5xl",
    md: "text-7xl",
    lg: "text-[8rem]",
    xl: "text-[14rem]",
  };
  return (
    <span
      aria-hidden
      className={cn(
        "font-[family-name:var(--font-display-loaded)] leading-[0.85] text-bone block",
        italic && "italic",
        sizes[size],
        className,
      )}
    >
      {letter}
    </span>
  );
}
