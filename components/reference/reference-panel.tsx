"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { LetterGlyph } from "@/components/specimen/letter-glyph";
import { LETTER_BY_CODE, type LetterCode } from "@/lib/letters";
import { pad2, cn } from "@/lib/utils";

/**
 * The "what shape should I make" panel.
 * Renders a public-domain ASL letter illustration (Wikimedia Commons,
 * inverted for the dark theme). Falls back to a typographic glyph when
 * the image is missing.
 */
export function ReferencePanel({
  letter,
  className,
  variant = "play",
  mirror = false,
}: {
  letter: LetterCode;
  className?: string;
  variant?: "play" | "practice";
  /** Flip the reference horizontally so it matches a mirrored selfie video. */
  mirror?: boolean;
}) {
  const meta = LETTER_BY_CODE[letter];

  return (
    <div className={cn("relative h-full w-full overflow-hidden bg-ink-2", className)}>
      {/* Captions */}
      <div className="absolute left-4 top-4 z-10 flex items-center gap-3">
        <span className="caption-acid">REFERENCE</span>
        <span className="caption text-bone-3">·</span>
        <span className="caption">{pad2(meta.index)} / 24</span>
      </div>

      <div className="absolute right-4 top-4 z-10 text-right">
        <span className="caption text-bone-2 block">{meta.nato}</span>
        <span className="caption text-bone-3 block">fig. {pad2(meta.index)}</span>
      </div>

      {/* Hairline composition guides */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="h-px w-full bg-rule-soft opacity-30" />
        <div className="absolute h-full w-px bg-rule-soft opacity-30" />
      </div>

      {/* Photo (animated key transition) */}
      <div className="absolute inset-0 flex items-center justify-center px-8 pt-12 pb-12 sm:pt-16 sm:pb-16">
        <AnimatePresence mode="wait">
          <motion.div
            key={letter}
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.99 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="relative flex h-full w-full items-center justify-center"
          >
            <LetterImage letter={letter} mirror={mirror} />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom — annotation (practice variant only) */}
      {variant === "practice" ? (
        <div className="absolute inset-x-4 bottom-3 z-10">
          <p className="caption text-bone-3 truncate">{meta.description}</p>
        </div>
      ) : null}
    </div>
  );
}

/** Loads the inverted SVG. Falls back to a typographic glyph if missing. */
function LetterImage({ letter, mirror }: { letter: LetterCode; mirror?: boolean }) {
  const [errored, setErrored] = useState(false);

  if (errored) {
    return (
      <LetterGlyph
        letter={letter}
        size="xl"
        className={cn(
          "text-[18vw] sm:text-[22vw] lg:text-[14vw] xl:text-[12rem] text-bone",
          mirror && "[transform:scaleX(-1)]",
        )}
      />
    );
  }

  // eslint-disable-next-line @next/next/no-img-element
  return (
    <img
      src={`/letters/asl/${letter.toLowerCase()}.svg`}
      alt={`Hand shape for the letter ${letter}`}
      onError={() => setErrored(true)}
      className={cn(
        "max-h-full max-w-full object-contain",
        "[filter:invert(0.97)_sepia(0.08)_saturate(0.4)]",
        "[width:auto] [height:auto]",
        mirror && "[transform:scaleX(-1)]",
      )}
      draggable={false}
    />
  );
}
