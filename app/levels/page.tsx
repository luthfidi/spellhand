"use client";

import Link from "next/link";
import { LEVELS, LEVEL_NUMBERS } from "@/lib/levels";
import { SpellhandMark } from "@/components/marks/spellhand-mark";
import { HandPreferenceModal } from "@/components/onboard/hand-preference-modal";
import { useHandPreference } from "@/lib/hooks/use-hand-preference";
import { pad2 } from "@/lib/utils";

export default function LevelsPage() {
  const { hand, setHand, loaded } = useHandPreference();
  const showModal = loaded && !hand;

  return (
    <main className="min-h-svh bg-ink">
      <HandPreferenceModal open={showModal} onPick={setHand} />

      {/* Edition strip */}
      <div className="ruled-b">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-2 sm:px-6">
          <Link href="/" className="inline-flex items-center gap-2 hover:text-acid">
            <SpellhandMark />
          </Link>
          <Link href="/" className="caption hover:text-acid">
            ← Home
          </Link>
        </div>
      </div>

      <section className="mx-auto max-w-6xl px-4 pt-12 pb-6 sm:px-6 sm:pt-20">
        <p className="caption mb-2">§ Choose your level</p>
        <h1 className="font-[family-name:var(--font-display-loaded)] text-5xl italic leading-[0.95] sm:text-7xl">
          Four levels.
        </h1>
      </section>

      <section className="ruled-y -mx-px">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 [&>*]:border-l [&>*]:border-r [&>*]:border-rule [&>*]:-ml-px">
          {LEVEL_NUMBERS.map((n) => {
            const lv = LEVELS[n];
            return (
              <Link
                key={n}
                href={`/levels/${n}`}
                className="group relative block aspect-square overflow-hidden bg-ink px-5 py-4 transition-colors hover:bg-ink-2"
              >
                <div className="flex items-start justify-between">
                  <span className="caption">LEVEL {pad2(n)}</span>
                  <span className="caption text-bone-3">{lv.words.length} WORDS</span>
                </div>

                <div className="absolute inset-x-0 top-[44%] flex -translate-y-1/2 justify-center">
                  <span className="font-[family-name:var(--font-display-loaded)] text-[10rem] italic leading-[0.85] text-bone transition-colors group-hover:text-acid sm:text-[12rem]">
                    {n}
                  </span>
                </div>

                <div className="absolute inset-x-5 bottom-4 flex items-end justify-between gap-3">
                  <p className="caption truncate text-bone-2">
                    +{lv.newLetters.join(" ")}
                  </p>
                  <span className="caption-acid">→</span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <section>
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-6 sm:px-6">
          <Link href="/" className="caption hover:text-acid">
            About →
          </Link>
          {hand ? (
            <button
              onClick={() => setHand(hand === "right" ? "left" : "right")}
              className="caption hover:text-acid"
            >
              {hand === "right" ? "RIGHT-HANDED" : "LEFT-HANDED"} · CHANGE
            </button>
          ) : null}
        </div>
      </section>
    </main>
  );
}
