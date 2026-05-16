"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { useTranslations } from "next-intl";
import { SpellhandMark } from "@/components/marks/spellhand-mark";
import { SpecimenSheet } from "@/components/specimen/specimen-sheet";
import { LocaleToggle } from "@/components/locale-toggle";
import { STAGE_MOTION } from "./stage-motion";

export function HeroStage({ onBegin }: { onBegin: () => void }) {
  const t = useTranslations("hero");
  const steps = [
    { title: t("step_1_title"), body: t("step_1_body") },
    { title: t("step_2_title"), body: t("step_2_body") },
    { title: t("step_3_title"), body: t("step_3_body") },
  ];
  return (
    <motion.main {...STAGE_MOTION} className="min-h-svh">
      {/* Edition strip */}
      <div className="ruled-b">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-3 py-2 sm:px-6">
          <SpellhandMark />
          <motion.div
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.1, duration: 0.5 }}
            className="flex items-center gap-3 sm:gap-4"
          >
            <LocaleToggle />
            <span aria-hidden className="text-bone-3">·</span>
            <a
              href="https://github.com/luthfidi"
              target="_blank"
              rel="noreferrer"
              className="caption group hover:text-acid"
            >
              <span className="hidden sm:inline">{t("made_by")}</span>
              <span className="sm:hidden">{t("made_by_short")}</span>{" "}
              <span aria-hidden className="inline-block transition-transform group-hover:translate-x-0.5">
                →
              </span>
            </a>
          </motion.div>
        </div>
      </div>

      {/* Hero */}
      <section className="ruled-b">
        <div className="relative mx-auto flex min-h-[calc(100svh-2.75rem)] max-w-6xl flex-col px-4 sm:px-6">
          <div className="flex flex-1 flex-col items-center justify-center py-6 text-center sm:py-8">
            {/* Line-by-line stagger reveal, no overflow clipping */}
            <h1 className="font-[family-name:var(--font-display-loaded)] text-[15vw] italic leading-[0.92] tracking-[-0.02em] text-bone sm:text-[8rem] sm:leading-[0.9] md:text-[10rem]">
              <motion.span
                initial={{ opacity: 0, y: 32 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                className="block"
              >
                {t("tagline_1")}
              </motion.span>
              <motion.span
                initial={{ opacity: 0, y: 32 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.18, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                className="block text-acid not-italic"
              >
                {t("tagline_2")}
              </motion.span>
              <motion.span
                initial={{ opacity: 0, y: 32 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.36, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                className="block"
              >
                {t("tagline_3")}
              </motion.span>
            </h1>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.75, duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
              className="mt-8 flex flex-col items-center gap-4 sm:mt-14"
            >
              <button
                onClick={onBegin}
                className="group relative inline-flex items-center gap-4 overflow-hidden bg-acid px-8 py-4 text-ink transition-transform duration-300 hover:-translate-y-1 hover:shadow-[0_18px_40px_-12px_color-mix(in_oklab,var(--color-acid)_55%,transparent)] sm:gap-5 sm:px-14 sm:py-6"
              >
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/45 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-full"
                />
                <span className="relative font-mono text-base font-medium tracking-[0.06em] sm:text-xl">
                  {t("cta")}
                </span>
                <span
                  aria-hidden
                  className="relative text-lg transition-transform duration-300 group-hover:translate-x-1.5 sm:text-2xl"
                >
                  →
                </span>
              </button>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.05, duration: 0.6 }}
                className="caption text-bone-3"
              >
                {t("privacy_note")}
              </motion.p>
            </motion.div>
          </div>

          <motion.nav
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0, duration: 0.5 }}
            className="caption flex items-center justify-between gap-3 border-t border-rule py-3 sm:py-4"
          >
            <div className="flex items-center gap-3 sm:gap-5">
              <a href="#how" className="hover:text-acid">{t("nav_how")}</a>
              <span className="text-bone-3">·</span>
              <a href="#catalogue" className="hover:text-acid">{t("nav_catalogue")}</a>
              <span className="text-bone-3">·</span>
              <a href="#certificate" className="hover:text-acid">{t("nav_certificate")}</a>
            </div>
            <motion.span
              aria-hidden
              animate={{ y: [0, 4, 0] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
            >
              ↓
            </motion.span>
          </motion.nav>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="ruled-b scroll-mt-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto max-w-6xl px-4 pt-10 pb-4 sm:px-6 sm:pt-16"
        >
          <p className="caption mb-2">{t("section_how_eyebrow")}</p>
          <h2 className="font-[family-name:var(--font-display-loaded)] text-3xl italic leading-[0.95] sm:text-5xl">
            {t("section_how_title")}
          </h2>
        </motion.div>
        <div className="ruled-t -mx-px">
          <div className="grid grid-cols-1 md:grid-cols-3 [&>*]:border-l [&>*]:border-r [&>*]:border-rule [&>*]:-ml-px">
            {steps.map((step, i) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ delay: i * 0.12, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="relative bg-ink px-5 py-7 sm:px-8 sm:py-10"
              >
                <p className="caption-acid">STEP {String(i + 1).padStart(2, "0")}</p>
                <p className="mt-3 font-[family-name:var(--font-display-loaded)] text-2xl italic leading-tight sm:text-3xl">
                  {step.title}
                </p>
                <p className="mt-3 max-w-xs text-sm leading-relaxed text-bone-2">
                  {step.body}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Catalogue */}
      <section id="catalogue" className="ruled-b scroll-mt-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto max-w-6xl px-4 pt-10 pb-4 sm:px-6 sm:pt-16"
        >
          <p className="caption mb-2">{t("section_catalogue_eyebrow")}</p>
          <h2 className="font-[family-name:var(--font-display-loaded)] text-3xl italic leading-[0.95] sm:text-5xl">
            {t("section_catalogue_title")}
          </h2>
        </motion.div>
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{ duration: 0.7 }}
        >
          <SpecimenSheet />
        </motion.div>
      </section>

      {/* Certificate */}
      <section id="certificate" className="ruled-b scroll-mt-12">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 sm:py-12 lg:grid-cols-12 lg:gap-16 lg:py-20">
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-5"
          >
            <p className="caption mb-2">{t("section_cert_eyebrow")}</p>
            <h2 className="font-[family-name:var(--font-display-loaded)] text-3xl italic leading-[0.95] sm:text-5xl">
              {t("section_cert_title")}
            </h2>
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-bone-2 sm:mt-6">
              {t("section_cert_body")}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 32, rotate: -1.5 }}
            whileInView={{ opacity: 1, y: 0, rotate: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            whileHover={{ y: -4, rotate: 0.3 }}
            className="group lg:col-span-7"
          >
            <div className="hairline relative aspect-[4/3] w-full bg-ink-2 p-4 transition-shadow duration-500 group-hover:shadow-[0_20px_60px_-20px_color-mix(in_oklab,var(--color-acid)_30%,transparent)] sm:p-10">
              <div className="hairline-soft absolute inset-2 sm:inset-5" aria-hidden />
              {["left-2 top-2 sm:left-3 sm:top-3", "right-2 top-2 sm:right-3 sm:top-3", "left-2 bottom-2 sm:left-3 sm:bottom-3", "right-2 bottom-2 sm:right-3 sm:bottom-3"].map((c, i) => (
                <motion.span
                  key={c}
                  aria-hidden
                  initial={{ opacity: 0, scale: 0 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.4 + i * 0.08, duration: 0.4 }}
                  className={`absolute ${c} h-1.5 w-1.5 bg-acid`}
                />
              ))}
              <div className="relative flex h-full flex-col items-center justify-center px-2 text-center sm:px-0">
                <p className="caption-acid text-[10px] sm:text-xs">{t("cert_brand")}</p>
                <p className="mt-2 font-[family-name:var(--font-display-loaded)] text-2xl italic leading-tight sm:mt-3 sm:text-5xl">
                  {t("cert_title_line_1")}<br />{t("cert_title_line_2")}
                </p>
                <p className="caption mt-4 text-bone-3 sm:mt-6">{t("cert_awarded")}</p>
                <p className="mt-1 font-[family-name:var(--font-display-loaded)] text-lg italic text-bone-2 sm:text-2xl">
                  {t("cert_name_placeholder")}
                </p>
                <p className="caption mt-4 max-w-xs text-bone-3 sm:mt-6">
                  {t("cert_subtitle")}
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer>
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.6 }}
          className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-5 px-4 py-8 sm:flex-row sm:items-end sm:gap-6 sm:px-6 sm:py-10"
        >
          <div>
            <SpellhandMark />
            <p className="caption mt-2 text-bone-3">{t("footer_tagline")}</p>
          </div>
          <div className="caption flex flex-wrap items-center gap-x-5 gap-y-2 text-bone-3 sm:gap-x-6">
            <a href="https://commons.wikimedia.org/wiki/Category:American_manual_alphabet" className="hover:text-acid" target="_blank" rel="noreferrer">
              {t("footer_illustrations")}
            </a>
            <a href="https://developers.google.com/mediapipe" className="hover:text-acid" target="_blank" rel="noreferrer">
              {t("footer_mediapipe")}
            </a>
            <a href="https://fingerspelling.xyz" className="hover:text-acid" target="_blank" rel="noreferrer">
              {t("footer_inspired")}
            </a>
            <Link href="/practice/a" className="hover:text-acid">{t("footer_practice")}</Link>
            <span>{t("footer_copy")}</span>
          </div>
        </motion.div>
      </footer>
    </motion.main>
  );
}
