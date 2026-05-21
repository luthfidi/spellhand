import type { MetadataRoute } from "next";
import { LETTERS } from "@/lib/letters";
import { LEVEL_NUMBERS } from "@/lib/levels";

const SITE = "https://spellhand.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    { url: `${SITE}/`, lastModified: now, changeFrequency: "monthly", priority: 1 },
    { url: `${SITE}/levels`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE}/challenge`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
  ];

  const levelPages: MetadataRoute.Sitemap = LEVEL_NUMBERS.map((n) => ({
    url: `${SITE}/levels/${n}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  const practicePages: MetadataRoute.Sitemap = LETTERS.map((l) => ({
    url: `${SITE}/practice/${l.code.toLowerCase()}`,
    lastModified: now,
    changeFrequency: "yearly",
    priority: 0.4,
  }));

  return [...staticPages, ...levelPages, ...practicePages];
}
