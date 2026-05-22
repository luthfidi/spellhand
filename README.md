# Spellhand

> Learn the American Sign Language alphabet with your phone camera. A mobile-first remake of [fingerspelling.xyz](https://fingerspelling.xyz), powered by MediaPipe and Supabase.

**Live:** [spellhand.vercel.app](https://spellhand.vercel.app) · **License:** [MIT](LICENSE)

---

## Why

[fingerspelling.xyz](https://fingerspelling.xyz) is a beautifully made ASL trainer, but desktop-only. Phones are where most casual learners are. Spellhand is the same idea, built mobile-first, with accounts and a shareable completion certificate.

## What ships today

- **24 static ASL letters** with public-domain SVG references (J and Z need motion, deferred to a future phase)
- **4 progressive levels** + a final memory-mode Challenge
- **Real-time hand tracking** via MediaPipe `HandLandmarker` (21 keypoints, runs entirely in the browser)
- **Rule-based classifier**: one TypeScript function per letter; no model training, no dataset
- **Per-finger sub-check overlay**: when you're off, you see *which finger* is wrong
- **Right- / left-handed** toggle that mirrors detection logic, not just the video
- **Magic-link auth** + a **shareable certificate** with a dynamic OG image and JSON-LD credential schema at `/cert/[token]`
- **Localized** in English and Bahasa Indonesia (`next-intl`)
- **Installable** as a PWA (manifest + adaptive icons; offline support deferred)
- **Accessibility**: `prefers-reduced-motion` respected, live regions for hints, AA-passing contrast
- **Skip-letter escape hatch** after sustained struggle, and arrow-key navigation on the practice page

## Quickstart

Prerequisites: **Node.js ≥ 20.9**. Supabase is optional; the trainer itself works without it.

```bash
git clone https://github.com/luthfidi/spellhand.git
cd spellhand
npm install
cp .env.example .env.local        # fill in Supabase keys if you want the cert flow
npm run dev                       # http://localhost:3000
```

**Optional: Supabase (for the certificate flow)**

1. Create a project at [supabase.com](https://supabase.com); copy Project URL + `anon` key into `.env.local`.
2. **SQL Editor** → paste [`supabase/migrations/0001_initial.sql`](supabase/migrations/0001_initial.sql) → Run.
3. **Authentication → URL Configuration** → add `<origin>/auth/callback` to the redirect allowlist for every environment.

The trainer pages short-circuit cleanly when Supabase isn't configured; only the cert claim + share pages require it.

`getUserMedia` needs HTTPS off `localhost`. To test on a phone over LAN, run Next with `--experimental-https`.

## Stack

| Layer | Choice |
|---|---|
| Framework | **Next.js 16** (App Router, Turbopack) + TypeScript |
| Styling | **Tailwind CSS v4** (CSS-first `@theme`) |
| Hand tracking | **`@mediapipe/tasks-vision`** (`HandLandmarker`) |
| Classification | Custom rule-based module (pattern inspired by [`fingerpose`](https://github.com/andypotato/fingerpose)) |
| Animation | **Motion** (`motion/react`) |
| i18n | **`next-intl`** (English, Bahasa Indonesia) |
| Backend | **Supabase** via **`@supabase/ssr`** |
| Hosting | Vercel |

## How it works

MediaPipe `HandLandmarker` returns 21 landmark points per frame. For each of the 24 static ASL letters, [`lib/recognition/asl/implemented.ts`](lib/recognition/asl/implemented.ts) defines a function that decomposes the handshape into independent per-finger sub-checks (curled, extended, angle, tip distance). Each sub-check is a boolean; confidence is `passed / total`. A letter "locks in" when every check passes for a few consecutive frames.

This is rule-based on purpose: no training set, no model bundle. Every letter is debuggable in plain TypeScript, and rule tuning happens with a live `?debug=1` overlay that exposes every sub-check value in real time. The original site validated the same approach with an ASL professor.

`J` and `Z` are dynamic (the pinky traces a J, the index traces a Z), so they need a short landmark sequence rather than a still frame and are deferred.

## Project structure

```
app/                          # Next.js App Router
  _stages/                    # hero, level-select, level-intro, play, challenge
  _actions/                   # server actions (auth, cert, locale)
  auth/callback/              # magic-link redirect handler
  levels/ play/ practice/     # progression + practice modes
  challenge/ challenge/claim/ # final exam, cert claim
  cert/[token]/               # public share page + dynamic OG image (next/og)
  manifest.ts robots.ts       # PWA + SEO file-based metadata
  sitemap.ts apple-icon.tsx
components/
  camera/ feedback/           # video, overlay, gate, confidence ring
  reference/ specimen/        # in-game refs + landing cards
  onboard/                    # hand-preference modal (first-visit)
  motion-provider.tsx         # MotionConfig (respects reduced-motion)
  error-boundary.tsx          # render-error recovery UI
  debug/                      # ?debug=1 sub-check panel
lib/
  mediapipe/                  # camera + HandLandmarker lifecycle
  recognition/asl/            # one rule per letter
  supabase/                   # browser + server clients
  i18n/                       # next-intl messages + hint translator
  hooks/                      # use-hand-preference, use-warm-mediapipe
  letters.ts levels.ts        # static catalogue
  letter-display.ts           # per-letter mirror/rotation hints
  timings.ts                  # shared gameplay timing constants
middleware.ts                 # Supabase auth-cookie refresh (Edge)
supabase/migrations/          # SQL: profiles + certificates + RLS
public/letters/asl/           # a.svg .. y.svg (Wikimedia, PD)
```

## Schema

Two tables, one public view (see [`supabase/migrations/0001_initial.sql`](supabase/migrations/0001_initial.sql)):

- `profiles`: 1:1 with `auth.users`, auto-created on signup via trigger.
- `certificates`: one per user (unique constraint), issued on completing the Challenge.
- `certificate_public`: anon-readable view exposing only `share_token`, `display_name`, `issued_at` (never the underlying `user_id`).

Both tables are RLS-protected. Public `/cert/[token]` pages query the view, not the table.

## Environment

```bash
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
NEXT_PUBLIC_SITE_URL=http://localhost:3000   # set to the deployed origin in prod
```

On Vercel, set the same three under **Settings → Environment Variables** and **redeploy**. Env changes don't apply to existing deployments.

## Privacy

All hand tracking runs in the browser; no video frames ever leave the device. Only landmark-derived data (the cert row itself) is persisted in Supabase.

## Roadmap

- **Phase 4**: `J` and `Z` (motion classification, ~30-frame landmark sequence)
- **Phase 5**: 3D rigged hand reference (React Three Fiber) replacing the SVGs
- **Phase 6**: Offline-capable PWA (service worker via Serwist) + global leaderboard. *Install + adaptive icons already ship.*
- **Phase 7**: BISINDO support (two-hand tracking)

Per-letter mastery, streaks, and tiered certificates are designed (`language_code` column, future tables) but not yet shipped, to keep the schema minimal until those features need a store.

## Acknowledgments

- [fingerspelling.xyz](https://fingerspelling.xyz) by [DEPT®](https://www.deptagency.com/case/a-pioneering-approach-to-teaching-the-sign-language-alphabet/) and the American Society for Deaf Children: the inspiration
- [MediaPipe](https://developers.google.com/mediapipe): hand tracking
- [`fingerpose`](https://github.com/andypotato/fingerpose): gesture-rule pattern
- [Motion](https://motion.dev) · [Supabase](https://supabase.com) · [shadcn/ui](https://ui.shadcn.com)
- ASL letter SVGs from [Wikimedia Commons](https://commons.wikimedia.org/wiki/Category:American_manual_alphabet), public domain

## License

[MIT](LICENSE)
