import Link from "next/link";
import { SpellhandMark } from "@/components/marks/spellhand-mark";

export function TopNav({
  rightSlot,
  caption,
}: {
  rightSlot?: React.ReactNode;
  caption?: string;
}) {
  return (
    <header className="ruled-b sticky top-0 z-40 bg-ink/85 backdrop-blur-sm">
      <div className="mx-auto flex h-12 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link
          href="/"
          className="group inline-flex items-center gap-3"
          aria-label="Spellhand home"
        >
          <SpellhandMark />
          {caption ? (
            <span className="caption hidden sm:inline-block border-l border-rule pl-3">
              {caption}
            </span>
          ) : null}
        </Link>
        <div className="caption flex items-center gap-4">{rightSlot}</div>
      </div>
    </header>
  );
}
