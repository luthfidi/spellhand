import { ImageResponse } from "next/og";
import { createClient } from "@supabase/supabase-js";
import en from "@/lib/i18n/messages/en.json";
import id from "@/lib/i18n/messages/id.json";

export const runtime = "edge";

/* Hex approximations of the OKLCH dark palette in globals.css (satori has no
 * OKLCH). These mirror the `[data-theme="dark"]` tokens the on-screen
 * CertificateCard is pinned to, so the PNG matches the card. */
const INK = "#1c1812";
const INK_2 = "#26211b";
const BONE = "#ece3d4";
const BONE_2 = "#d8d1c0";
const BONE_3 = "#beb7a4";
const RULE = "#5b5240";
const ACID = "#d2f76b";

/**
 * Fetch a Google Font subset for satori. Passing `text` returns a tailored TTF
 * containing only the requested glyphs — keeps the response small and avoids
 * the multi-subset @font-face splits that Google serves to modern UAs (which
 * default to WOFF2, a format satori can't read).
 */
async function loadGoogleFont(query: string, text: string): Promise<ArrayBuffer> {
  const url = `https://fonts.googleapis.com/css2?family=${query}&text=${encodeURIComponent(text)}`;
  const css = await (await fetch(url)).text();
  const match = css.match(/src: url\((https:[^)]+)\) format\('(opentype|truetype)'\)/);
  if (!match) throw new Error(`font URL not found for ${query}`);
  const res = await fetch(match[1]);
  if (!res.ok) throw new Error(`font fetch failed for ${query} (${res.status})`);
  return res.arrayBuffer();
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const searchParams = new URL(req.url).searchParams;
  const isId = searchParams.get("lang") === "id";
  const c = (isId ? id : en).cert;
  const dateLocale = isId ? "id-ID" : "en-US";

  // `format=download` → 4:3, matching the on-screen card. Default → 1.91:1 for
  // social link unfurls (the OG <meta> image).
  const download = searchParams.get("format") === "download";
  const width = 1200;
  const height = download ? 900 : 630;

  // Public view — anon read allowed by RLS, no auth cookies needed.
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } },
  );

  const { data } = await supabase
    .from("certificate_public")
    .select("display_name, issued_at")
    .eq("share_token", token)
    .maybeSingle();

  if (!data) {
    return new Response("Certificate not found", { status: 404 });
  }

  const dateLabel = new Date(data.issued_at)
    .toLocaleDateString(dateLocale, { year: "numeric", month: "long", day: "numeric" })
    .toUpperCase();

  const nameLen = data.display_name.length;
  const nameSize = nameLen > 28 ? 40 : nameLen > 18 ? 52 : 64;

  // Glyph set the satori PNG actually needs. Both fonts share the same subset —
  // a bit redundant per glyph, but a single concatenation is simpler than
  // splitting serif vs mono and the per-font subsets stay tiny.
  const text =
    c.brand +
    c.title_line_1 +
    c.title_line_2 +
    c.awarded_to.toUpperCase() +
    data.display_name +
    c.subtitle.toUpperCase() +
    dateLabel;

  // Best-effort font load; if Google Fonts is unreachable, fall through to
  // satori's serif/mono defaults so the PNG still renders.
  let fonts: Array<{ name: string; data: ArrayBuffer; style: "italic" | "normal"; weight: 400 }> | undefined;
  try {
    const [serifData, monoData] = await Promise.all([
      loadGoogleFont("Instrument+Serif:ital@1", text),
      loadGoogleFont("IBM+Plex+Mono", text),
    ]);
    fonts = [
      { name: "Instrument Serif", data: serifData, style: "italic", weight: 400 },
      { name: "IBM Plex Mono", data: monoData, style: "normal", weight: 400 },
    ];
  } catch (err) {
    console.warn("[cert/og] font load failed, using satori defaults:", err);
  }

  const response = new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          backgroundColor: INK,
          padding: 32,
        }}
      >
        <div
          style={{
            position: "relative",
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: INK_2,
            border: `2px solid ${RULE}`,
            padding: 56,
          }}
        >
          {/* Inner hairline frame */}
          <div
            style={{
              position: "absolute",
              top: 20,
              left: 20,
              right: 20,
              bottom: 20,
              border: `1px solid ${RULE}`,
            }}
          />

          {/* Corner acid dots */}
          {[
            { top: 14, left: 14 },
            { top: 14, right: 14 },
            { bottom: 14, left: 14 },
            { bottom: 14, right: 14 },
          ].map((pos, i) => (
            <div
              key={i}
              style={{ position: "absolute", width: 12, height: 12, backgroundColor: ACID, ...pos }}
            />
          ))}

          {/* Brand */}
          <div
            style={{
              display: "flex",
              color: ACID,
              fontFamily: "IBM Plex Mono",
              fontSize: 22,
              letterSpacing: 5,
              fontWeight: 500,
            }}
          >
            {c.brand}
          </div>

          {/* Title — two lines, serif italic (matches the card) */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              color: BONE,
              fontSize: 86,
              fontStyle: "italic",
              lineHeight: 1,
              marginTop: 28,
              textAlign: "center",
              fontFamily: "Instrument Serif",
            }}
          >
            <span style={{ display: "flex" }}>{c.title_line_1}</span>
            <span style={{ display: "flex", marginTop: 8 }}>{c.title_line_2}</span>
          </div>

          {/* awarded to (caption → uppercase on screen) */}
          <div
            style={{
              display: "flex",
              color: BONE_3,
              fontFamily: "IBM Plex Mono",
              fontSize: 16,
              letterSpacing: 4,
              marginTop: 56,
            }}
          >
            {c.awarded_to.toUpperCase()}
          </div>

          {/* Display name — scales down for long names (DB caps at 40 chars). */}
          <div
            style={{
              display: "flex",
              color: BONE,
              fontSize: nameSize,
              fontStyle: "italic",
              fontFamily: "Instrument Serif",
              marginTop: 12,
              maxWidth: 960,
              textAlign: "center",
              lineHeight: 1.05,
            }}
          >
            {data.display_name}
          </div>

          {/* Subtitle (caption → uppercase on screen) */}
          <div
            style={{
              display: "flex",
              color: BONE_2,
              fontFamily: "IBM Plex Mono",
              fontSize: 18,
              letterSpacing: 2,
              marginTop: 56,
              maxWidth: 760,
              textAlign: "center",
            }}
          >
            {c.subtitle.toUpperCase()}
          </div>

          {/* Date */}
          <div
            style={{
              display: "flex",
              color: BONE_3,
              fontFamily: "IBM Plex Mono",
              fontSize: 16,
              letterSpacing: 4,
              marginTop: 24,
            }}
          >
            {dateLabel}
          </div>
        </div>
      </div>
    ),
    { width, height, ...(fonts ? { fonts } : {}) },
  );

  // Certificates are immutable once issued — long cache is safe. lang/format
  // variants are separate URLs, so the cache key stays correct.
  response.headers.set(
    "Cache-Control",
    "public, max-age=300, s-maxage=86400, stale-while-revalidate=604800",
  );
  return response;
}
