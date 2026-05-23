import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { LETTERS, LETTER_BY_CODE, type LetterCode } from "@/lib/letters";
import { PracticeSession } from "./practice-session";

export function generateStaticParams() {
  return LETTERS.map((l) => ({ letter: l.code.toLowerCase() }));
}

interface Params {
  params: Promise<{ letter: string }>;
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { letter } = await params;
  const code = letter.toUpperCase() as LetterCode;
  const meta = LETTER_BY_CODE[code];
  if (!meta) return {};

  const t = await getTranslations("metadata");
  const title = t("practice_title", { letter: meta.code });
  const description = t("practice_description", {
    letter: meta.code,
    nato: meta.nato,
  });

  return {
    title,
    description,
    openGraph: { title, description, type: "article" },
    twitter: { card: "summary_large_image", title, description },
    alternates: { canonical: `/practice/${meta.code.toLowerCase()}` },
  };
}

export default async function PracticeLetterPage({ params }: Params) {
  const { letter } = await params;
  const code = letter.toUpperCase() as LetterCode;
  const meta = LETTER_BY_CODE[code];
  if (!meta) notFound();
  return <PracticeSession meta={meta} />;
}
