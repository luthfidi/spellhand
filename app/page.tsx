import Link from "next/link";
import { LETTERS } from "@/lib/letters";
import { SpellhandMark } from "@/components/marks/spellhand-mark";
import { SpecimenSheet } from "@/components/specimen/specimen-sheet";
import { HeroIntro } from "./_landing/hero-intro";

const implementedCount = LETTERS.filter((l) => l.implemented).length;

export default function LandingPage() {
  return (
    <main className="min-h-svh">
      {/* ──────────── HERO ──────────── */}
      <section className="ruled-b relative overflow-hidden">
        {/* Edition strip */}
        <div className="ruled-b">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-2 sm:px-6">
            <SpellhandMark />
            <div className="caption hidden gap-6 sm:flex">
              <span>EDITION 01</span>
              <span>·</span>
              <span>SPECIMEN CATALOGUE</span>
              <span>·</span>
              <span>ASL · LATIN</span>
            </div>
            <Link href="/play" className="caption-acid hover:underline">
              Begin →
            </Link>
          </div>
        </div>

        <HeroIntro />

        {/* Numeric strip */}
        <div className="ruled-y">
          <dl className="mx-auto grid max-w-6xl grid-cols-2 divide-x divide-rule sm:grid-cols-4">
            <Stat label="Specimens" value="24" hint="Static letters" />
            <Stat label="Tracked points" value="21" hint="Per detected hand" />
            <Stat label="Implemented" value={`${implementedCount} / 24`} hint="Phase 01 release" />
            <Stat label="Camera" value="On-device" hint="No frames uploaded" />
          </dl>
        </div>
      </section>

      {/* ──────────── HOW ──────────── */}
      <section className="ruled-b">
        <div className="mx-auto grid max-w-6xl gap-12 px-4 py-16 sm:grid-cols-12 sm:px-6">
          <div className="sm:col-span-4">
            <p className="caption mb-4">§ 02 · Methodology</p>
            <h2 className="font-[family-name:var(--font-display-loaded)] text-4xl italic leading-[0.95] sm:text-5xl">
              An apparatus
              <br />
              for the hand.
            </h2>
          </div>
          <ol className="sm:col-span-8 grid gap-px bg-rule sm:grid-cols-3">
            {STEPS.map((s, i) => (
              <li
                key={s.title}
                className="bg-ink p-6"
              >
                <div className="caption mb-4 text-acid">
                  Step {String(i + 1).padStart(2, "0")}
                </div>
                <h3 className="mb-2 font-[family-name:var(--font-display-loaded)] text-2xl">
                  {s.title}
                </h3>
                <p className="text-sm leading-relaxed text-bone-2">{s.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ──────────── CATALOGUE ──────────── */}
      <section className="ruled-b">
        <div className="mx-auto max-w-6xl px-4 pb-2 pt-12 sm:px-6">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <p className="caption mb-2">§ 03 · The catalogue</p>
              <h2 className="font-[family-name:var(--font-display-loaded)] text-4xl italic leading-[0.95] sm:text-5xl">
                Twenty-four
                <br />
                still figures.
              </h2>
            </div>
            <p className="caption max-w-xs text-right text-bone-2">
              J and Z are dynamic and arrive in a later edition.
            </p>
          </div>
        </div>
        <SpecimenSheet />
      </section>

      {/* ──────────── PROVENANCE / FOOTER ──────────── */}
      <footer className="ruled-b">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-12 sm:px-6">
          <div className="sm:col-span-5">
            <SpellhandMark />
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-bone-2">
              A mobile-first remake of{" "}
              <a className="underline decoration-acid underline-offset-2" href="https://fingerspelling.xyz">
                fingerspelling.xyz
              </a>
              . Built as a field guide for the American Sign Language fingerspelling alphabet.
            </p>
          </div>
          <div className="sm:col-span-3">
            <p className="caption mb-3">Provenance</p>
            <ul className="space-y-1 text-sm text-bone-2">
              <li>MediaPipe · Google</li>
              <li>fingerpose pattern · @andypotato</li>
              <li>ASDC chart · public domain</li>
            </ul>
          </div>
          <div className="sm:col-span-4">
            <p className="caption mb-3">Privacy</p>
            <p className="text-sm leading-relaxed text-bone-2">
              The camera feed never leaves your device. Hand landmarks are computed locally
              in the browser; nothing is uploaded.
            </p>
          </div>
        </div>
        <div className="ruled-t">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
            <p className="caption">© Spellhand · Edition 01</p>
            <p className="caption">spellhand.vercel.app</p>
          </div>
        </div>
      </footer>
    </main>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="px-4 py-5 sm:px-6">
      <p className="caption mb-2">{label}</p>
      <p className="font-[family-name:var(--font-display-loaded)] text-3xl italic leading-none text-bone sm:text-4xl">
        {value}
      </p>
      <p className="mt-1 text-xs text-bone-3">{hint}</p>
    </div>
  );
}

const STEPS = [
  {
    title: "Grant a single permission.",
    body:
      "Spellhand needs your camera to see the shape of your hand. Frames are processed in your browser; nothing is sent away.",
  },
  {
    title: "Form the specimen.",
    body:
      "Mimic the printed handshape. The instrument watches twenty-one points on your hand, compares them to the rule for the target letter, and replies in real time.",
  },
  {
    title: "Earn the letter.",
    body:
      "Hold the shape until it locks. Move on to the next letter, the next word, the next specimen. Twenty-four letters await indexing.",
  },
];
