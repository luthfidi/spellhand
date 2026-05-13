import Link from "next/link";
import { SpellhandMark } from "@/components/marks/spellhand-mark";
import { SpecimenSheet } from "@/components/specimen/specimen-sheet";
import { HeroIntro } from "./_landing/hero-intro";

export default function LandingPage() {
  return (
    <main className="min-h-svh">
      {/* ──────────── EDITION STRIP ──────────── */}
      <div className="ruled-b">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-2 sm:px-6">
          <SpellhandMark />
          <Link href="/levels" className="caption-acid hover:underline">
            Let&apos;s go →
          </Link>
        </div>
      </div>

      {/* ──────────── HERO ──────────── */}
      <section className="ruled-b">
        <HeroIntro />
      </section>

      {/* ──────────── CATALOGUE ──────────── */}
      <section id="catalogue" className="ruled-b scroll-mt-12">
        <div className="mx-auto max-w-6xl px-4 pt-12 pb-4 sm:px-6">
          <p className="caption mb-2">§ 01 · The catalogue</p>
          <h2 className="font-[family-name:var(--font-display-loaded)] text-4xl italic leading-[0.95] sm:text-5xl">
            Twenty-four specimens.
          </h2>
        </div>
        <SpecimenSheet />
      </section>

      {/* ──────────── CERTIFICATE ──────────── */}
      <section id="certificate" className="ruled-b scroll-mt-12">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-12 lg:gap-16 lg:py-20">
          <div className="lg:col-span-5">
            <p className="caption mb-2">§ 02 · The certificate</p>
            <h2 className="font-[family-name:var(--font-display-loaded)] text-4xl italic leading-[0.95] sm:text-5xl">
              One reward.
            </h2>
            <p className="mt-6 max-w-sm text-sm leading-relaxed text-bone-2">
              Finish every level and you earn it. One certificate, signed and dated,
              shareable as a link.
            </p>
          </div>

          <div className="lg:col-span-7">
            <div className="hairline relative aspect-[4/3] w-full bg-ink-2 p-6 sm:p-10">
              {/* Inner frame */}
              <div className="hairline-soft absolute inset-3 sm:inset-5" aria-hidden />

              {/* Corner marks */}
              {[
                "left-3 top-3",
                "right-3 top-3",
                "left-3 bottom-3",
                "right-3 bottom-3",
              ].map((c) => (
                <span
                  key={c}
                  aria-hidden
                  className={`absolute ${c} h-1.5 w-1.5 bg-acid`}
                />
              ))}

              {/* Content */}
              <div className="relative flex h-full flex-col items-center justify-center text-center">
                <p className="caption-acid">SPELLHAND · EDITION 01</p>
                <p className="mt-3 font-[family-name:var(--font-display-loaded)] text-3xl italic leading-tight sm:text-5xl">
                  Certificate of
                  <br />
                  Fingerspelling
                </p>
                <p className="caption mt-6 text-bone-3">awarded to</p>
                <p className="mt-1 font-[family-name:var(--font-display-loaded)] text-xl italic text-bone-2 sm:text-2xl">
                  — your name —
                </p>
                <p className="caption mt-6 max-w-xs text-bone-3">
                  for mastering the American Sign Language alphabet
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ──────────── FOOTER ──────────── */}
      <footer>
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-4 py-10 sm:flex-row sm:items-end sm:px-6">
          <div>
            <SpellhandMark />
            <p className="caption mt-2 text-bone-3">A field guide to the ASL alphabet.</p>
          </div>
          <div className="caption flex flex-wrap gap-x-6 gap-y-2 text-bone-3">
            <a
              href="https://commons.wikimedia.org/wiki/Category:American_manual_alphabet"
              className="hover:text-acid"
              target="_blank"
              rel="noreferrer"
            >
              Illustrations
            </a>
            <a
              href="https://developers.google.com/mediapipe"
              className="hover:text-acid"
              target="_blank"
              rel="noreferrer"
            >
              MediaPipe
            </a>
            <a
              href="https://fingerspelling.xyz"
              className="hover:text-acid"
              target="_blank"
              rel="noreferrer"
            >
              Inspired by fingerspelling.xyz
            </a>
            <span>© Spellhand</span>
          </div>
        </div>
      </footer>
    </main>
  );
}

