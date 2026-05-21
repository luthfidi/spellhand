import type { MetadataRoute } from "next";

const SITE = "https://spellhand.vercel.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Public cert pages are intentionally shareable but the share_token is
        // unguessable, so leaving them crawlable is fine. The token URLs aren't
        // listed in the sitemap, so they only get indexed if someone links them.
      },
    ],
    sitemap: `${SITE}/sitemap.xml`,
  };
}
