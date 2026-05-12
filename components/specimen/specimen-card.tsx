import Link from "next/link";
import { pad2 } from "@/lib/utils";
import type { LetterMeta } from "@/lib/letters";
import { LetterGlyph } from "./letter-glyph";

/**
 * Catalogue card for a single letter, in the style of a specimen plate.
 */
export function SpecimenCard({ meta }: { meta: LetterMeta }) {
  const dim = !meta.implemented;
  return (
    <Link
      href={`/practice/${meta.code.toLowerCase()}`}
      className="group ruled-b ruled-t -mt-px relative block aspect-[3/4] overflow-hidden bg-ink px-4 py-3 transition-colors hover:bg-ink-2"
    >
      <div className="flex items-start justify-between">
        <span className="caption">
          {pad2(meta.index)} / 24
        </span>
        <span className="caption">
          L{meta.level}
        </span>
      </div>

      <div className="absolute inset-x-0 top-[42%] flex -translate-y-1/2 items-end justify-center">
        <LetterGlyph
          letter={meta.code}
          size="xl"
          className={
            dim
              ? "text-bone-3/45 [text-shadow:none]"
              : "text-bone transition-colors group-hover:text-acid"
          }
        />
      </div>

      <div className="absolute inset-x-4 bottom-3 flex items-end justify-between gap-3">
        <div className="caption text-bone-2">
          {meta.nato}
        </div>
        {dim ? (
          <div className="caption text-bone-3">
            <span className="cursor-blink">▮</span> wip
          </div>
        ) : (
          <div className="caption-acid">
            ready
          </div>
        )}
      </div>
    </Link>
  );
}
