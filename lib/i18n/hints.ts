import type { Locale } from "./config";

/**
 * Translates a sub-check label emitted by the recognition engine into the
 * active locale. Recognition rules in `lib/recognition/asl/implemented.ts`
 * and `lib/recognition/helpers.ts` produce English labels. When the user
 * picks Indonesian, the on-screen hint runs through this map before display.
 *
 * Returns the original label as a fallback so a missed entry doesn't break
 * the UI; it just shows the English string.
 */

const FINGERS_ID: Record<string, string> = {
  Thumb: "Ibu jari",
  Index: "Telunjuk",
  Middle: "Jari tengah",
  Ring: "Jari manis",
  Pinky: "Kelingking",
};

const STATES_ID: Record<string, string> = {
  curled: "menekuk",
  extended: "lurus",
  "half-curled": "setengah menekuk",
};

const STATIC_ID: Record<string, string> = {
  // J / Z motion classifier
  "Trace the J shape": "Lacak bentuk J",
  "Trace the Z shape": "Lacak bentuk Z",
  "Trace a bigger J": "Lacak J yang lebih besar",
  "Trace a bigger Z": "Lacak Z yang lebih besar",
  "Pinky drops down": "Kelingking turun ke bawah",
  "Pinky hooks at the bottom": "Kelingking menghook di bawah",
  "Trace is tall enough": "Lacakan cukup tinggi",
  "Top stroke goes right": "Stroke atas ke kanan",
  "Diagonal goes down-left": "Diagonal turun ke kiri",
  "Bottom stroke goes right": "Stroke bawah ke kanan",
  // Static letters
  "All four tips press against thumb": "Empat ujung jari menempel ke ibu jari",
  "Hand horizontal": "Tangan horizontal",
  "Hand inverted (index points down)": "Tangan terbalik (telunjuk ke bawah)",
  "Hand pointing up": "Tangan menghadap ke atas",
  "Index + middle angled apart": "Telunjuk + jari tengah membentuk sudut",
  "Index + middle crossed": "Telunjuk + jari tengah menyilang",
  "Index + middle spread apart": "Telunjuk + jari tengah terbuka lebar",
  "Index + middle touching": "Telunjuk + jari tengah menempel",
  "Index + thumb close the loop": "Telunjuk + ibu jari menutup lingkaran",
  "Index + thumb pinched": "Telunjuk + ibu jari mencubit",
  "Index + thumb point downward": "Telunjuk + ibu jari ke bawah",
  "Index hooked (~90°)": "Telunjuk membentuk kait (~90°)",
  "Index points upward (bent, not down)": "Telunjuk ke atas (menekuk, bukan ke bawah)",
  "Open C-gap (thumb ↔ index)": "Celah C terbuka (ibu jari ↔ telunjuk)",
  "Others curl toward thumb": "Jari lain menekuk ke ibu jari",
  "Three fingers spread": "Tiga jari terbuka",
  "Thumb along side": "Ibu jari di samping",
  "Thumb between index + middle": "Ibu jari di antara telunjuk + jari tengah",
  "Thumb curved": "Ibu jari melengkung",
  "Thumb folded across palm": "Ibu jari terlipat di telapak",
  "Thumb folded": "Ibu jari terlipat",
  "Thumb meets middle fingertip": "Ibu jari menyentuh ujung jari tengah",
  "Thumb pokes between index + middle": "Ibu jari menyembul di antara telunjuk + jari tengah",
  "Thumb tucked under fingers": "Ibu jari terselip di bawah jari",
  "Thumb wraps across the front": "Ibu jari membungkus di depan",
  "Thumb ~ 90° from index": "Ibu jari ~ 90° dari telunjuk",
};

const FINGER_STATE_RE = /^(Thumb|Index|Middle|Ring|Pinky) (curled|extended|half-curled)$/;

export function translateHint(label: string, locale: Locale): string {
  if (locale === "en") return label;

  const fromStatic = STATIC_ID[label];
  if (fromStatic) return fromStatic;

  const m = label.match(FINGER_STATE_RE);
  if (m) {
    const finger = FINGERS_ID[m[1]];
    const state = STATES_ID[m[2]];
    if (finger && state) return `${finger} ${state}`;
  }

  return label;
}
