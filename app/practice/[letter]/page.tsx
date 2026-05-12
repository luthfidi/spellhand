import Link from "next/link";
import { notFound } from "next/navigation";
import { LETTERS, LETTER_BY_CODE, type LetterCode } from "@/lib/letters";
import { TopNav } from "@/components/nav/top-nav";
import { pad2 } from "@/lib/utils";
import { PracticeCamera } from "./practice-camera";

export function generateStaticParams() {
  return LETTERS.map((l) => ({ letter: l.code.toLowerCase() }));
}

interface Params {
  params: Promise<{ letter: string }>;
}

export default async function PracticeLetterPage({ params }: Params) {
  const { letter } = await params;
  const code = letter.toUpperCase() as LetterCode;
  const meta = LETTER_BY_CODE[code];
  if (!meta) notFound();

  const prev = LETTERS[(meta.index - 2 + LETTERS.length) % LETTERS.length];
  const next = LETTERS[meta.index % LETTERS.length];

  return (
    <main className="min-h-svh bg-ink">
      <TopNav
        caption={`§ ${pad2(meta.index)} / 24 · PRACTICE`}
        rightSlot={
          <div className="flex items-center gap-4">
            <Link className="hover:text-acid" href={`/practice/${prev.code.toLowerCase()}`}>
              ← {prev.code}
            </Link>
            <Link className="hover:text-acid" href={`/practice/${next.code.toLowerCase()}`}>
              {next.code} →
            </Link>
          </div>
        }
      />

      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:py-10">
        <div className="grid gap-8 lg:grid-cols-12">
          {/* ──────────── SPECIMEN PLATE ──────────── */}
          <section className="lg:col-span-5">
            <div className="ruled-y px-1 py-2">
              <div className="flex items-center justify-between">
                <p className="caption-acid">SPECIMEN {pad2(meta.index)}</p>
                <p className="caption">LEVEL {meta.level}</p>
              </div>
            </div>

            <div className="ruled-b relative flex aspect-square items-center justify-center bg-ink-2 px-6">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/letters/asl/${meta.code.toLowerCase()}.svg`}
                alt={`Hand shape for the letter ${meta.code}`}
                className="max-h-full max-w-full object-contain
                           [filter:invert(0.97)_sepia(0.08)_saturate(0.4)]
                           [transform:scaleX(-1)]"
                draggable={false}
              />
              <div className="absolute inset-x-4 bottom-3 flex items-center justify-between">
                <span className="caption text-bone-2">{meta.nato}</span>
                <span className="caption text-bone-3">
                  {meta.implemented ? "GRADED" : "WIP · UNGRADED"}
                </span>
              </div>
            </div>

            <div className="py-6">
              <p className="caption mb-3">DESCRIPTION</p>
              <p className="font-[family-name:var(--font-display-loaded)] text-2xl italic leading-snug">
                {meta.description}
              </p>
            </div>

            <div className="ruled-t py-6">
              <p className="caption mb-3">ANATOMY</p>
              <ul className="space-y-2.5 font-mono text-sm text-bone-2">
                {meta.fingers.map((line, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="caption shrink-0 pt-0.5 text-bone-3">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </div>

            {!meta.implemented ? (
              <div className="ruled-t py-6">
                <p className="caption text-amber">PHASE NOTE</p>
                <p className="mt-2 font-mono text-sm leading-relaxed text-bone-2">
                  This letter is documented but its rule is not yet wired up.
                  The camera will run, but no grading happens here yet.
                </p>
              </div>
            ) : null}
          </section>

          {/* ──────────── PRACTICE PANEL ──────────── */}
          <section className="lg:col-span-7">
            <PracticeCamera targetLetter={meta.code} implemented={meta.implemented} />
          </section>
        </div>
      </div>
    </main>
  );
}
