import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ChallengeClient } from "./challenge-client";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("metadata");
  const title = t("challenge_title");
  const description = t("challenge_description");
  return {
    title,
    description,
    openGraph: { title, description, type: "website" },
    twitter: { card: "summary_large_image", title, description },
    alternates: { canonical: "/challenge" },
  };
}

export default function ChallengePage() {
  return <ChallengeClient />;
}
