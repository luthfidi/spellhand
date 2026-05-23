import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { LevelsClient } from "./levels-client";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("metadata");
  const title = t("levels_title");
  const description = t("levels_description");
  return {
    title,
    description,
    openGraph: { title, description, type: "website" },
    twitter: { card: "summary_large_image", title, description },
    alternates: { canonical: "/levels" },
  };
}

export default function LevelsPage() {
  return <LevelsClient />;
}
