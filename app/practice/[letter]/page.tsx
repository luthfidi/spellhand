import { notFound } from "next/navigation";
import { LETTERS, LETTER_BY_CODE, type LetterCode } from "@/lib/letters";
import { PracticeSession } from "./practice-session";

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
  return <PracticeSession meta={meta} />;
}
