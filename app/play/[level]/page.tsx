import { notFound } from "next/navigation";
import { LEVEL_NUMBERS, levelFromParam } from "@/lib/levels";
import { PlayClient } from "./play-client";

export function generateStaticParams() {
  return LEVEL_NUMBERS.map((n) => ({ level: String(n) }));
}

export default async function PlayPage({ params }: { params: Promise<{ level: string }> }) {
  const { level: raw } = await params;
  const lv = levelFromParam(raw);
  if (!lv) notFound();
  return <PlayClient level={lv.number} />;
}
