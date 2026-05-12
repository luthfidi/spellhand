"use client";

import Link from "next/link";
import { motion } from "motion/react";

const reveal = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
};

export function HeroIntro() {
  return (
    <div className="relative mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:grid-cols-12 sm:px-6 sm:py-20">
      {/* Side note */}
      <motion.aside
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.6 }}
        className="caption sm:col-span-3 sm:pt-2"
      >
        <p className="mb-2 text-acid">// Field guide</p>
        <p className="text-bone-2">
          For the parent of a Deaf child. For the curious student. For the hand on the
          camera at any hour.
        </p>
        <p className="mt-4 text-bone-3">
          Compiled with reference to the American Society for Deaf Children alphabet chart.
        </p>
      </motion.aside>

      {/* Title */}
      <div className="sm:col-span-9">
        <motion.h1
          variants={reveal}
          initial="initial"
          animate="animate"
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="font-[family-name:var(--font-display-loaded)] text-[14vw] italic leading-[0.82] tracking-[-0.01em] text-bone sm:text-[8.2rem] md:text-[10rem]"
        >
          A field guide
          <br />
          to the spelling
          <br />
          of the <span className="text-acid not-italic">hand</span>.
        </motion.h1>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="mt-10 flex flex-wrap items-end gap-x-12 gap-y-6"
        >
          <p className="max-w-md text-base leading-relaxed text-bone-2 sm:text-lg">
            Twenty-four still figures of the American Sign Language alphabet, observed
            through your camera and recorded, specimen by specimen, until you know them
            by heart.
          </p>
          <div className="flex items-center gap-6">
            <Link
              href="/play"
              className="hairline group inline-flex items-center gap-3 bg-acid px-5 py-3 text-ink transition-transform hover:-translate-y-px"
            >
              <span className="font-mono text-sm font-medium tracking-[0.05em]">
                BEGIN TRAINING
              </span>
              <span aria-hidden>→</span>
            </Link>
            <Link
              href="/practice/a"
              className="caption text-bone-2 underline-offset-4 hover:underline"
            >
              or inspect a specimen
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
