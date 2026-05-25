"use client";

import { useState } from "react";
import { LetterGlyph } from "@/components/specimen/letter-glyph";
import {
  INVERTED_LETTERS,
  ROTATED_LETTERS,
  letterImageSrc,
} from "@/lib/letter-display";
import type { LetterCode } from "@/lib/letters";

interface LetterImageProps {
  letter: LetterCode;
  mirror?: boolean;
  /** Override the default English alt text (e.g. for localisation). */
  alt?: string;
  /**
   * Set when this image is the above-the-fold reference (play / practice
   * stage) so the browser fetches it eagerly with high priority — it's the
   * LCP element there. Leave false for off-screen / secondary uses.
   */
  priority?: boolean;
}

export function LetterImage({
  letter,
  mirror = false,
  alt,
  priority = false,
}: LetterImageProps) {
  const [errored, setErrored] = useState(false);
  const effectiveMirror = INVERTED_LETTERS.has(letter) ? !mirror : mirror;
  const rotation = ROTATED_LETTERS.get(letter) ?? 0;

  // Mirror first, then rotate — reversing the order would flip the visual
  // rotation direction after mirroring.
  const transform =
    (effectiveMirror ? "scaleX(-1) " : "") + (rotation ? `rotate(${rotation}deg)` : "");
  const style = transform.trim() ? { transform } : undefined;

  if (errored) {
    return (
      <LetterGlyph
        letter={letter}
        size="xl"
        className="text-[24vw] sm:text-[18vw] lg:text-[14vw] xl:text-[12rem] text-bone"
        style={style}
      />
    );
  }

  // eslint-disable-next-line @next/next/no-img-element
  return (
    <img
      src={letterImageSrc(letter)}
      alt={alt ?? `Hand shape for the letter ${letter}`}
      onError={() => setErrored(true)}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : "auto"}
      decoding="async"
      className="max-h-[22vh] max-w-[55vw] object-contain [filter:invert(0.97)_sepia(0.08)_saturate(0.4)] [width:auto] [height:auto] sm:max-h-full sm:max-w-full"
      style={style}
      draggable={false}
    />
  );
}
