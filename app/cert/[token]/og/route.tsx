import { ImageResponse } from "next/og";
import { createClient } from "@supabase/supabase-js";

export const runtime = "edge";

/* Hex approximations of the OKLCH palette used in globals.css.
 * next/og (satori) doesn't support OKLCH, so we pin sRGB equivalents. */
const INK = "#14181d";
const INK_2 = "#1d2229";
const BONE = "#e9ecf0";
const BONE_2 = "#c4cbd4";
const BONE_3 = "#b1bac5";
const RULE = "#5b6470";
const ACID = "#5deef3";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const lang = new URL(req.url).searchParams.get("lang") === "id" ? "id-ID" : "en-US";

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

  const dateLabel = new Date(data.issued_at).toLocaleDateString(lang, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

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
              style={{
                position: "absolute",
                width: 12,
                height: 12,
                backgroundColor: ACID,
                ...pos,
              }}
            />
          ))}

          {/* Header — wordmark */}
          <div
            style={{
              display: "flex",
              color: ACID,
              fontFamily: "monospace",
              fontSize: 22,
              letterSpacing: 5,
              fontWeight: 500,
            }}
          >
            SPELLHAND
          </div>

          {/* Title */}
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
              fontFamily: "serif",
            }}
          >
            <span style={{ display: "flex" }}>Certificate of</span>
            <span style={{ display: "flex", marginTop: 8 }}>
              Fingerspelling
            </span>
          </div>

          {/* awarded to */}
          <div
            style={{
              display: "flex",
              color: BONE_3,
              fontFamily: "monospace",
              fontSize: 16,
              letterSpacing: 4,
              marginTop: 56,
            }}
          >
            AWARDED TO
          </div>

          {/* Display name — scale down for long names to avoid overflow in
              the 1200×630 canvas. The DB caps at 40 chars; serif italic at
              64px fits ~18 chars comfortably. */}
          <div
            style={{
              display: "flex",
              color: BONE,
              fontSize:
                data.display_name.length > 28
                  ? 40
                  : data.display_name.length > 18
                    ? 52
                    : 64,
              fontStyle: "italic",
              fontFamily: "serif",
              marginTop: 12,
              maxWidth: 960,
              textAlign: "center",
              lineHeight: 1.05,
            }}
          >
            {data.display_name}
          </div>

          {/* description */}
          <div
            style={{
              display: "flex",
              color: BONE_2,
              fontFamily: "monospace",
              fontSize: 18,
              letterSpacing: 1,
              marginTop: 56,
              maxWidth: 700,
              textAlign: "center",
            }}
          >
            for mastering the American Sign Language alphabet
          </div>

          {/* date */}
          <div
            style={{
              display: "flex",
              color: BONE_3,
              fontFamily: "monospace",
              fontSize: 16,
              letterSpacing: 4,
              marginTop: 24,
            }}
          >
            {dateLabel.toUpperCase()}
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    },
  );

  // Certificates are immutable once issued — long cache is safe. Different
  // lang= variants are separate URLs, so the cache key is correct.
  response.headers.set(
    "Cache-Control",
    "public, max-age=300, s-maxage=86400, stale-while-revalidate=604800",
  );
  return response;
}
