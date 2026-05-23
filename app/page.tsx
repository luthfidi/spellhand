import { HeroStage } from "./_stages/hero-stage";

const SITE = "https://spellhand.vercel.app";

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${SITE}/#website`,
      name: "Spellhand",
      url: SITE,
      description:
        "Mobile-first ASL fingerspelling trainer with in-browser MediaPipe hand tracking.",
      inLanguage: ["en", "id"],
    },
    {
      "@type": "SoftwareApplication",
      "@id": `${SITE}/#app`,
      name: "Spellhand",
      applicationCategory: "EducationalApplication",
      operatingSystem: "Web",
      browserRequirements:
        "Requires JavaScript, a camera, and a modern browser (Chrome, Safari, Firefox, Edge).",
      description:
        "Mobile-first remake of fingerspelling.xyz. Learn the 24 static ASL letters with on-device MediaPipe hand tracking and per-finger feedback. Magic-link auth and a shareable completion certificate.",
      url: SITE,
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
      featureList: [
        "24 static ASL letters",
        "In-browser hand tracking via MediaPipe HandLandmarker",
        "Rule-based per-finger classifier",
        "Right- and left-handed support",
        "Shareable completion certificate",
      ],
    },
  ],
};

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <HeroStage />
    </>
  );
}
