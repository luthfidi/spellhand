import Link from "next/link";
import { notFound } from "next/navigation";
import { LEVELS, LEVEL_NUMBERS, levelFromParam } from "@/lib/levels";
import { LETTER_BY_CODE } from "@/lib/letters";
import { SpellhandMark } from "@/components/marks/spellhand-mark";
import { cn, pad2 } from "@/lib/utils";

export function generateStaticParams() {
  return LEVEL_NUMBERS.map((n) => ({ level: String(n) }));
}

interface Params {
  params: Promise<{ level: string }>;
}

export default async function LevelIntroPage({ params }: Params) {
  const { level: raw } = await params;
  const lv = levelFromParam(raw);
  if (!lv) notFound();

  const newSet = new Set(lv.newLetters);

  return (
    <main className="min-h-svh bg-ink">
      {/* Edition strip */}
      <div className="ruled-b">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-2 sm:px-6">
          <Link href="/" className="inline-flex items-center gap-2 hover:text-acid">
            <SpellhandMark />
          </Link>
          <Link href="/levels" className="caption hover:text-acid">
            ← Levels
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-16">
        <p className="caption mb-2">§ LEVEL {pad2(lv.number)}</p>
        <h1 className="font-[family-name:var(--font-display-loaded)] text-6xl italic leading-[0.9] sm:text-8xl">
          Level {lv.number}.
        </h1>

        <p className="mt-8 max-w-xl text-base leading-relaxed text-bone-2 sm:text-lg">
          {lv.blurb}
        </p>

        {/* Letter pool */}
        <div className="ruled-y -mx-px mt-12">
          <div className="caption ml-px py-3 text-bone-3">
            Letter pool · {lv.pool.length} letters
          </div>
        </div>
        <div className="grid grid-cols-6 -mx-px sm:grid-cols-8 lg:grid-cols-12 [&>*]:border-l [&>*]:border-b [&>*]:border-rule [&>*]:-ml-px [&>*]:-mb-px">
          {lv.pool.map((code) => {
            const meta = LETTER_BY_CODE[code];
            const isNew = newSet.has(code);
            return (
              <div
                key={code}
                className={cn(
                  "relative flex aspect-square items-center justify-center bg-ink",
                  isNew && "bg-acid/[0.06]",
                )}
                title={meta.nato}
              >
                <span
                  className={cn(
                    "font-[family-name:var(--font-display-loaded)] text-3xl italic leading-none sm:text-4xl",
                    isNew ? "text-acid" : "text-bone-2",
                  )}
                >
                  {code}
                </span>
                {isNew ? (
                  <span className="caption-acid absolute right-1 top-1 text-[9px]">
                    NEW
                  </span>
                ) : null}
              </div>
            );
          })}
        </div>

        {/* CTA */}
        <div className="mt-12 flex flex-col items-start gap-4 sm:mt-16">
          <Link
            href={`/play/${lv.number}`}
            className="group inline-flex items-center gap-5 bg-acid px-10 py-5 text-ink transition-transform hover:-translate-y-px sm:px-14 sm:py-6"
          >
            <span className="font-mono text-base font-medium tracking-[0.06em] sm:text-lg">
              TURN ON WEBCAM
            </span>
            <span aria-hidden className="text-lg transition-transform group-hover:translate-x-1 sm:text-xl">
              →
            </span>
          </Link>
          <p className="text-xs text-bone-3 sm:text-sm">
            Look at the hand and copy the shape. {lv.words.length} words to spell.
          </p>
        </div>
      </div>
    </main>
  );
}
