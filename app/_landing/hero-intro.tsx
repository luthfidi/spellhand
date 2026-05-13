"use client";

import Link from "next/link";
import { motion } from "motion/react";

export function HeroIntro() {
  return (
    <div className="relative mx-auto flex min-h-[calc(100svh-2.75rem)] max-w-6xl flex-col px-4 sm:px-6">
      <div className="flex flex-1 flex-col items-center justify-center py-8 text-center">
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="font-[family-name:var(--font-display-loaded)] text-[12vw] italic leading-[0.88] tracking-[-0.02em] text-bone sm:text-[8rem] md:text-[10rem]"
        >
          Learn the
          <br />
          <span className="text-acid not-italic">alphabet</span>
          <br />
          by hand.
        </motion.h1>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.45, duration: 0.5 }}
          className="mt-10 sm:mt-14"
        >
          <Link
            href="/levels"
            className="group inline-flex items-center gap-5 bg-acid px-10 py-5 text-ink transition-transform hover:-translate-y-px sm:px-14 sm:py-6"
          >
            <span className="font-mono text-lg font-medium tracking-[0.06em] sm:text-xl">
              LET&apos;S GO
            </span>
            <span aria-hidden className="text-xl transition-transform group-hover:translate-x-1 sm:text-2xl">
              →
            </span>
          </Link>
        </motion.div>
      </div>

      {/* Scroll cue — each label jumps to its section */}
      <motion.nav
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9, duration: 0.6 }}
        className="caption flex items-center justify-between gap-4 border-t border-rule py-4"
      >
        <div className="flex items-center gap-5">
          <a href="#catalogue" className="hover:text-acid">↓ Catalogue</a>
          <span className="text-bone-3">·</span>
          <a href="#certificate" className="hover:text-acid">Certificate</a>
        </div>
        <span aria-hidden>↓</span>
      </motion.nav>
    </div>
  );
}
