import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { LEVEL_NUMBERS, levelFromParam } from "@/lib/levels";
import { PlayClient } from "./play-client";

export function generateStaticParams() {
  return LEVEL_NUMBERS.map((n) => ({ level: String(n) }));
}

interface Params {
  params: Promise<{ level: string }>;
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { level: raw } = await params;
  const lv = levelFromParam(raw);
  if (!lv) return {};

  const t = await getTranslations("metadata");
  const title = t("play_title", { level: lv.number });
  const description = t("play_description", { level: lv.number });

  return {
    title,
    description,
    openGraph: { title, description, type: "article" },
    twitter: { card: "summary_large_image", title, description },
    alternates: { canonical: `/play/${lv.number}` },
  };
}

export default async function PlayPage({ params }: Params) {
  const { level: raw } = await params;
  const lv = levelFromParam(raw);
  if (!lv) notFound();
  return <PlayClient level={lv.number} />;
}
