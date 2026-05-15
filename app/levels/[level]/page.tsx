import { notFound } from "next/navigation";
import { LEVEL_NUMBERS, levelFromParam } from "@/lib/levels";
import { LevelIntroClient } from "./level-intro-client";

export function generateStaticParams() {
  return LEVEL_NUMBERS.map((n) => ({ level: String(n) }));
}

export default async function LevelIntroPage({ params }: { params: Promise<{ level: string }> }) {
  const { level: raw } = await params;
  const lv = levelFromParam(raw);
  if (!lv) notFound();
  return <LevelIntroClient level={lv.number} />;
}
