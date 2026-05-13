import { notFound } from "next/navigation";
import { LEVEL_NUMBERS, levelFromParam } from "@/lib/levels";
import { PlaySession } from "./play-session";

export function generateStaticParams() {
  return LEVEL_NUMBERS.map((n) => ({ level: String(n) }));
}

interface Params {
  params: Promise<{ level: string }>;
}

export default async function PlayLevelPage({ params }: Params) {
  const { level: raw } = await params;
  const lv = levelFromParam(raw);
  if (!lv) notFound();
  return <PlaySession level={lv} />;
}
