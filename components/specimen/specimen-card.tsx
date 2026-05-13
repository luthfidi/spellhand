import Link from "next/link";
import type { LetterMeta } from "@/lib/letters";
import { LetterGlyph } from "./letter-glyph";

/**
 * Catalogue card for a single letter. Minimal — just glyph + NATO name.
 */
export function SpecimenCard({ meta }: { meta: LetterMeta }) {
  return (
    <Link
      href={`/practice/${meta.code.toLowerCase()}`}
      className="group ruled-b ruled-t -mt-px relative block aspect-[3/4] overflow-hidden bg-ink px-4 py-3 transition-colors hover:bg-ink-2"
    >
      <div className="absolute inset-x-0 top-[42%] flex -translate-y-1/2 items-end justify-center">
        <LetterGlyph
          letter={meta.code}
          size="xl"
          className="text-bone transition-colors group-hover:text-acid"
        />
      </div>

      <div className="absolute inset-x-4 bottom-3 flex items-end justify-center">
        <div className="caption text-bone-2">{meta.nato}</div>
      </div>
    </Link>
  );
}
