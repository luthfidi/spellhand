# Spellhand — ASL Fingerspelling Trainer

> Learn the American Sign Language alphabet with your camera. A mobile-friendly remake of [fingerspelling.xyz](https://fingerspelling.xyz), powered by MediaPipe and Supabase.

**Live (target):** [spellhand.vercel.app](https://spellhand.vercel.app)
**Status:** Phase 1 (MVP) — frontend complete, backend integration next.
**UI language:** English (i18n-ready).

---

## Why this exists

[fingerspelling.xyz](https://fingerspelling.xyz) (by DEPT agency, in collaboration with the American Society for Deaf Children) is a beautiful browser-based ASL trainer that uses your webcam to recognise hand shapes. It has one big limitation: it is **desktop-only**. Phones are where most casual learners are.

Spellhand is a remake with the same core idea but built mobile-first, with progress tracking, accounts, and a roadmap toward 3D hand references.

---

## The name

**Spellhand** — a compound of *spell* + *hand*. Short, descriptive, easy to type. Deployed to **`spellhand.vercel.app`**.

---

## Sign-language scope (important: sign language is NOT universal)

There are **300+ sign languages** in the world; each country/region has its own. The most-spoken ones are Chinese, Indo-Pakistani, and Indonesian sign languages. Major families: ASL (American — one-handed alphabet), BSL (British — two-handed), BISINDO (Indonesian — mixed one/two-handed), and many more.

**Spellhand Phase 1 = ASL.** Why:
- Most learning resources & reference material exist for ASL
- One-handed alphabet → easier hand-tracking with a single `HandLandmarker` instance
- Matches the source of inspiration (fingerspelling.xyz)
- Biggest global learner audience for English speakers

**Future-proofing:** the data model uses a `language_code` column on every progress / certificate row (`asl`, `bisindo`, `bsl`, …). Recognition rules live under `lib/recognition/<language>/` so a contributor can add BISINDO without touching ASL code. Adding BISINDO is a stretch goal (Phase 7) — it needs two-hand tracking, which is a real complexity bump.

---

## Research summary (what fingerspelling.xyz actually does)

| Aspect | Original | Notes |
|---|---|---|
| Hand tracking | **MediaPipe Hands** (21 keypoints) | Same model we will use, via the newer `@mediapipe/tasks-vision` API |
| Classification | **Rule-based**, not a neural net | Checks hand rotation + per-finger curl/direction. Validated with an ASL professor. |
| Levels | 4 progressive levels | L1: `A, B, C, E, L, O, V, W, U, Y`; later levels add the rest of the static alphabet |
| Feedback | Real-time hints ("turn your hand", "well done!") | Multi-stage: orientation → finger position → match |
| Privacy | All processing in-browser | No camera data leaves the device |
| Letters | Static letters only (implied) | `J` and `Z` need motion tracking — original treats them carefully |

**ASL alphabet shape:** 24 letters are static handshapes. **`J` and `Z` are dynamic** — `J` traces a J with the pinky, `Z` traces a Z with the index. These need temporal modelling, not just a still-frame rule, so we postpone them to a later phase.

**Why rule-based over a trained CNN/LSTM:** no dataset needed, debuggable per letter, runs fast on mobile, and the original's success proves it's enough for fingerspelling. A trained model becomes attractive only when rule tuning hits diminishing returns, or for J/Z motion classification.

---

## Tech stack

Verified against Context7 docs on **2026-05-13**. Versions are the current stable line.

| Layer | Choice | Why |
|---|---|---|
| Framework | **Next.js 16** (App Router, Turbopack default) + TypeScript ≥5.1 | SSR for marketing pages, client components for camera. Turbopack is now default in `create-next-app`. |
| Styling | **Tailwind CSS v4** + shadcn/ui (v3.5+) | v4 is CSS-first (`@theme` in CSS, no `tailwind.config.js`), uses `@tailwindcss/postcss`. shadcn v3.5+ supports v4. |
| Hand tracking | **`@mediapipe/tasks-vision`** (`HandLandmarker`) | Current Web Tasks API: `FilesetResolver.forVisionTasks(wasmUrl)` → `HandLandmarker.createFromOptions(...)` → `detectForVideo(video, ts)`. GPU delegate supported. |
| Gesture classification | Custom rule-based module (pattern inspired by [`fingerpose`](https://github.com/andypotato/fingerpose)) | One rule file per ASL letter. See *Why not GestureRecognizer?* below. |
| Animation | **Motion** (`motion/react`) — formerly Framer Motion | Rebranded in 2024 to [motion.dev](https://motion.dev). `framer-motion` is now an alias. Use `import { motion } from "motion/react"`. |
| Backend | **Supabase** via **`@supabase/ssr`** | Auth + Postgres + Storage + (optional) Edge Functions. `createServerClient` pattern in middleware + Server Components. Always use `supabase.auth.getUser()` over `getSession()` on the server. |
| Hosting | Vercel | Zero-config Next.js, automatic HTTPS (required for `getUserMedia`). |
| PWA | **Serwist** (`@serwist/next`) | Modern Workbox fork; `next-pwa` is unmaintained. Service worker at `app/sw.ts` with `defaultCache` rules. |
| 3D (Phase 5+) | React Three Fiber v10 + drei | Only when we replace photos with a rigged hand. |
| PDF (Phase 3) | `@react-pdf/renderer` | Client- or server-rendered certificate PDFs. |
| State (game loop) | React state + `useReducer` initially; add Zustand if it gets gnarly | Don't reach for TanStack Query — Supabase server actions + Server Components cover most fetching. |

### Environment

- **Node.js ≥ 20.9** (Next 16 requirement; Node 18 is dropped)
- **TypeScript ≥ 5.1**
- **Browser targets**: Chrome / Edge / Firefox 111+, Safari 16.4+ (matches Next 16 baseline and unlocks modern Web APIs we need for the camera + WASM SIMD)
- **HTTPS required** for `getUserMedia` — Vercel handles this; for local dev use `https://localhost` via Next's `--experimental-https` or a self-signed cert if you want to test on a phone via LAN

### Why not MediaPipe `GestureRecognizer`?

MediaPipe also ships a `GestureRecognizer` task that detects 7 built-in gestures (thumbs up, peace, etc.) out of the box. We **don't** use it because:
- It only knows those 7 gestures — none are ASL letters
- Training a custom `gesture_recognizer.task` model bundle requires a labeled image dataset per letter, which is the dataset-pipeline overhead we're trying to avoid

Instead we use `HandLandmarker` (raw 21-point output) and write rules per letter in TypeScript. Easy to debug, easy to tune, no dataset.

---

## Feature plan

### Phase 1 — MVP ("it works on my phone")
- [ ] Webcam access (front camera by default, with a flip-camera toggle)
- [ ] MediaPipe `HandLandmarker` running at 20+ fps on mid-tier phones
- [ ] **All 24 static ASL letters** with photo references
- [ ] Rule-based classifier per letter
- [ ] Visual feedback: "show your hand", "turn your hand", "almost", "got it!"
- [ ] 4 levels of difficulty (mirroring fingerspelling.xyz progression)
- [ ] One full game loop: pick a word → spell it letter by letter → see score
- [ ] Mobile-first layout (portrait camera fills viewport)
- [ ] Right/left-handed toggle (mirrors detection logic, not just the video)

### Phase 2 — Supabase + persistence
- [ ] Supabase Auth (email magic link + Google)
- [ ] Profile table (display name, preferred hand)
- [ ] `letter_progress` table (attempts, success rate, mastered_at) with RLS
- [ ] Daily streak + lifetime stats
- [ ] Resume where you left off

### Phase 3 — Certificates (the killer feature)
A tiered certification system. Earning one mints a row in Supabase + a shareable public URL with an OG image; users can also download a PDF.
- [ ] **Bronze** — master the first 10 letters (`A B C E L O V W U Y`)
- [ ] **Silver** — master all 24 static letters
- [ ] **Gold** — complete all 4 levels and the word-spelling challenge
- [ ] **Platinum** — Phase 4 unlock (after `J` and `Z` ship)
- [ ] Public share page: `/cert/[token]` with OG image
- [ ] PDF generation (`@react-pdf/renderer` or `react-pdf-html`)
- [ ] One-click "Share to LinkedIn" button

### Phase 4 — J and Z (dynamic letters)
- [ ] Capture a short landmark sequence (~30 frames)
- [ ] Simple path-shape check (J = pinky traces J-curve; Z = index traces Z)
- [ ] Or a small TFJS LSTM if rules are too brittle
- [ ] Unlocks the **Platinum** certificate

### Phase 5 — 3D hand reference
- [ ] Replace photos with a rigged hand in React Three Fiber
- [ ] Pose the hand per letter; loop a subtle idle animation
- [ ] Optional: rotate the 3D hand to match the user's detected rotation (live mirror)

### Phase 6 — Polish & social
- [ ] PWA install prompt
- [ ] Global leaderboard (opt-in)
- [ ] Shareable score cards (OG image generation)
- [ ] Multiplayer "race to spell"

### Phase 7 — Other sign languages (stretch)
- [ ] BISINDO support (requires two-hand tracking — bigger refactor)
- [ ] Language switcher in profile

---

## Mobile-friendly checklist (vs. the original)

- Portrait camera, fills viewport
- Larger feedback labels, high contrast
- Front camera default (mirror video and detection)
- Flip-camera button for rear camera (some users prefer)
- Touch-sized buttons (44×44 min)
- iOS Safari verified (iOS Chrome can't access camera, so Safari is the iOS path)
- Reduced motion respected
- Works on a low-power profile (cap at 24 fps, smaller landmark model)
- Service worker so it loads offline after first visit
- Install-to-homescreen icon + splash

---

## Supabase usage

Supabase is the only backend. We use four of its products:

| Product | What for |
|---|---|
| **Auth** | Email magic-link + Google OAuth. Required for progress + certificates. |
| **Postgres** | Profiles, progress, sessions, certificates (schema below) |
| **Storage** | Generated certificate PDFs + share-card OG images |
| **Edge Functions** | (Optional, Phase 3+) Issue + sign certificate tokens, generate OG images |

### Auth pattern (App Router + `@supabase/ssr`)

Per the official `@supabase/ssr` design docs:

1. **Middleware (`middleware.ts`) is mandatory** — it's the only place that can refresh the auth cookie reliably before Server Components run. Use `createServerClient` with both `getAll` and `setAll` cookie handlers, call `supabase.auth.getUser()` early to trigger refresh, and forward updated cookies on the response.
2. **In Server Components**, instantiate a client with `getAll` only (you can't set cookies from a Server Component) and call `getUser()` for the current user.
3. **Always prefer `getUser()` over `getSession()` on the server** — `getSession()` only reads cookies and can be spoofed; `getUser()` revalidates against the auth server.
4. **In Route Handlers / Server Actions**, you can set cookies — use both `getAll` and `setAll`.

Every progress / certificate row carries a `language_code` column so a second sign language can be added later without schema changes.

### Schema sketch

```sql
-- profiles (1:1 with auth.users)
create table profiles (
  id uuid primary key references auth.users on delete cascade,
  display_name text,
  preferred_hand text check (preferred_hand in ('left','right')) default 'right',
  created_at timestamptz default now()
);

-- per-letter mastery (per language)
create table letter_progress (
  user_id uuid references auth.users on delete cascade,
  language_code text not null default 'asl',
  letter char(1) not null,
  attempts int default 0,
  successes int default 0,
  best_streak int default 0,
  mastered_at timestamptz,
  updated_at timestamptz default now(),
  primary key (user_id, language_code, letter)
);

-- game sessions
create table sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade,
  language_code text not null default 'asl',
  level int not null,
  score int not null,
  letters_correct int not null,
  letters_attempted int not null,
  started_at timestamptz default now(),
  ended_at timestamptz
);

-- daily streak
create table streaks (
  user_id uuid primary key references auth.users on delete cascade,
  current_streak int default 0,
  longest_streak int default 0,
  last_practice_date date
);

-- certificates: bronze / silver / gold / platinum
create table certificates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade,
  language_code text not null default 'asl',
  tier text not null check (tier in ('bronze','silver','gold','platinum')),
  issued_at timestamptz default now(),
  share_token text unique not null,  -- public URL slug
  pdf_path text,                     -- storage bucket key
  metadata jsonb,                    -- { display_name, score_summary, ... } snapshot at issue time
  unique (user_id, language_code, tier)
);
```

All user-owned tables get RLS: `auth.uid() = user_id`. The `certificates` table is special — anyone with a `share_token` can read a single row through a *public* view that exposes only the certificate display fields, not the underlying user id. The leaderboard is a public materialised view with display name + total score.

---

## Folder structure (current)

```
sign-language/
├── README.md
├── .env.example                          # template for Phase 2+ env vars
├── app/                                  # Next.js App Router
│   ├── page.tsx                          # / → HeroStage
│   ├── layout.tsx                        # fonts, metadata, ErrorBoundary
│   ├── _stages/                          # reusable stage components
│   │   ├── stage-motion.ts               # shared slide+fade config
│   │   ├── hero-stage.tsx
│   │   ├── level-select-stage.tsx
│   │   ├── level-intro-stage.tsx
│   │   ├── play-stage.tsx                # numbered levels (1–4)
│   │   └── challenge-stage.tsx           # final exam + cert end screen
│   ├── levels/page.tsx                   # /levels (with hand-pref modal)
│   ├── levels/[level]/page.tsx           # /levels/1..4 intro
│   ├── play/[level]/page.tsx             # /play/1..4 gameplay
│   ├── challenge/page.tsx                # /challenge (memory-only mode)
│   └── practice/[letter]/page.tsx        # /practice/a..y study mode
├── components/
│   ├── camera/                           # video, landmark overlay, gate
│   ├── reference/game-left-panel.tsx     # hand image + letter + word strip
│   ├── specimen/                         # catalogue cards on landing
│   ├── onboard/hand-preference-modal.tsx
│   ├── marks/spellhand-mark.tsx
│   ├── debug/sub-check-panel.tsx         # ?debug=1 floating panel
│   └── error-boundary.tsx
├── lib/
│   ├── mediapipe/use-hand-landmarker.ts  # MediaPipe + camera lifecycle
│   ├── recognition/
│   │   ├── asl/implemented.ts            # per-letter sub-check rules
│   │   ├── classify.ts                   # dispatcher
│   │   ├── helpers.ts                    # angle / curl / extended / aggregate
│   │   └── types.ts                      # Landmark, SubCheck, RuleResult
│   ├── hooks/use-hand-preference.ts      # localStorage RH/LH
│   ├── letters.ts                        # 24 LetterMeta entries
│   ├── levels.ts                         # LEVELS 1–4 + CHALLENGE
│   └── utils.ts                          # cn(), pad2()
└── public/
    └── letters/asl/                      # a.svg .. y.svg (Wikimedia, PD)
```

**Phase 2+ additions** (not yet created): `middleware.ts`, `app/cert/[token]/`,
`lib/supabase/`, `lib/certificates/`.

---

## Reference imagery sources (for letter photos)

Phase 1 uses a still image / illustration per letter. Candidate sources (verify licensing per asset before shipping):

- [**Wikimedia Commons — ASL alphabet SVG (public domain)**](https://commons.wikimedia.org/wiki/File:American_Sign_Language_ASL.svg) — clean SVG, safest license
- [**FreeSVG — ASL Alphabet Gallaudet**](https://freesvg.org/asl-alphabet-gallaudet-ann) — public domain SVG
- [**American Society for Deaf Children — free chart**](https://deafchildren.org/2019/06/free-asl-alphabet-chart/) — official, free for personal/educational use (check redistribution terms)
- [**Start ASL — free downloads**](https://www.startasl.com/american-sign-language-alphabet/) — multiple free chart formats
- [**Noun Project — ASL icons**](https://thenounproject.com/browse/icons/term/asl/) — attribution required on free tier
- [**Vecteezy — sign-language alphabet vectors**](https://www.vecteezy.com/free-vector/sign-language-alphabet) — free with attribution on free tier

**Recommendation:** start with the Wikimedia Commons SVG (public domain, no attribution needed) so we can ship without legal friction; commission custom illustrations or shoot real photos when we're ready to invest in design polish.

---

## Privacy & accessibility

Both are non-negotiable for an app teaching a Deaf-community language.

**Privacy**
- All hand tracking runs in the browser; **no video frames are uploaded** (matches the original fingerspelling.xyz promise).
- Camera permission is requested only on the `/play` route, with a plain-language explainer above the prompt.
- Show an explicit "denied" recovery screen with instructions per OS (not just an opaque error).
- Only landmark-derived data (success/fail counts) ever reaches Supabase.
- Documented in a short `/privacy` page; linked in the footer.

**Accessibility**
- All interactive feedback is **dual-channel** (icon + text), never colour-only — green/red alone fails for colour-blind users.
- Keyboard-accessible for non-game pages (skip-to-content, focus rings, ESC closes modals).
- `prefers-reduced-motion` respected for all Motion animations.
- Caption + alt text on every reference image.
- Sign-language learning content should ideally be reviewed by a Deaf consultant before any "official" launch — flag this for later.

---

## Testing strategy

Tracking real ML in CI is impossible. We test what we can:

| Layer | Approach |
|---|---|
| **Letter classifier rules** | Pure unit tests in Vitest. Feed in canned 21-landmark arrays (saved as JSON fixtures from real recordings) and assert the classifier returns the expected letter + confidence. This is the most important test suite. |
| **Game loop / scoring** | Unit tests on the reducer. Easy and high-value. |
| **Supabase RLS** | Integration tests against a local Supabase (`supabase start`) — sign in as user A, assert can't read user B's rows. |
| **UI smoke** | Playwright on the marketing pages + sign-in flow. Skip camera-dependent flows (Playwright can't fake `getUserMedia` reliably). |
| **Camera flow** | Manual on real devices: iOS Safari, Android Chrome, desktop Chrome/Firefox/Safari. Maintain a `manual-test.md` checklist. |

---

## Environment variables

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...        # server-only, for cert issuance / admin
SUPABASE_JWT_SECRET=...                  # for verifying certificate share tokens
CERT_SIGNING_SECRET=...                  # HMAC secret for signing cert payloads
NEXT_PUBLIC_SITE_URL=https://spellhand.vercel.app
```

---

## Performance budget

- **First-contentful paint (mobile mid-tier)**: < 2.0s
- **Hand-tracking framerate**: ≥ 20 fps on iPhone 12 / Pixel 6
- **MediaPipe WASM + model bundle**: lazy-loaded only on `/play` and `/practice/[letter]` — never on landing
- **Bundle (excluding MediaPipe)**: keep `app/play/page.tsx` JS payload under 200 KB gzipped
- **Battery**: cap detection at 24 fps when the document is hidden or the user is idle for > 5s

---

## Risks & open questions

- **iOS Safari camera quirks** — needs real-device testing, not just devtools (iOS Chrome can't access the camera at all)
- **Right-handed users on a front camera** — video is mirrored; classifier needs to know which "hand" it sees (use the `Handedness` output from `HandLandmarker` instead of relying on screen position)
- **Rule tuning effort** — each letter is hand-tuned, expect days of iteration; budget for it
- **J and Z** — postponed to Phase 4, may need a different approach entirely
- **Battery / heat on mobile** — running ML at 30fps is hot; cap the framerate and pause when idle
- **Tailwind v4 ecosystem** — some third-party Tailwind plugins still target v3. Pin to shadcn ≥ 3.5 which is v4-aware.
- **Certificate fraud** — share tokens must be unguessable; sign the certificate JSON with `CERT_SIGNING_SECRET` so the public share page can verify it independently of the row's existence.
- **Licensing of reference photos** — start with public-domain Wikimedia SVG; upgrade later
- **Deaf-community review** — before any public marketing as an "ASL app", get the content reviewed by a Deaf consultant (the original team did this with an ASL professor)

---

## Acknowledgments

- [fingerspelling.xyz](https://fingerspelling.xyz) by [DEPT®](https://www.deptagency.com/case/a-pioneering-approach-to-teaching-the-sign-language-alphabet/) and the American Society for Deaf Children — the inspiration
- [MediaPipe](https://developers.google.com/mediapipe) by Google — hand tracking
- [`fingerpose`](https://github.com/andypotato/fingerpose) by andypotato — gesture-rule pattern
- ASL letter illustrations — [Wikimedia Commons](https://commons.wikimedia.org/wiki/Category:American_manual_alphabet) `Sign_language_<L>.svg` series, public domain
- [Motion](https://motion.dev) — animation
- [Serwist](https://serwist.pages.dev) — service worker / PWA tooling
- [shadcn/ui](https://ui.shadcn.com) — components
- [Supabase](https://supabase.com) — backend

---

## License

TBD (MIT-style suggested for an open portfolio project).
