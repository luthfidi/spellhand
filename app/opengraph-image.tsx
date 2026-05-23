import { ImageResponse } from "next/og";

export const alt = "Spellhand — Learn ASL fingerspelling with your camera";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#1a1612",
          color: "#f0ebe0",
          display: "flex",
          flexDirection: "column",
          padding: "72px 80px",
          fontFamily: "Georgia, serif",
          position: "relative",
        }}
      >
        {/* Top rule */}
        <div
          style={{
            position: "absolute",
            top: 56,
            left: 80,
            right: 80,
            height: 1,
            background: "#5c554a",
          }}
        />
        {/* Eyebrow */}
        <div
          style={{
            display: "flex",
            fontFamily: "ui-monospace, Menlo, monospace",
            fontSize: 22,
            letterSpacing: "0.18em",
            color: "#cef000",
            textTransform: "uppercase",
            marginTop: 16,
          }}
        >
          § Spellhand
        </div>
        {/* Title */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            marginTop: 96,
            fontStyle: "italic",
            fontSize: 168,
            lineHeight: 0.92,
            letterSpacing: "-0.02em",
            color: "#f0ebe0",
          }}
        >
          <div style={{ display: "flex" }}>Learn the</div>
          <div style={{ display: "flex", color: "#cef000", fontStyle: "normal" }}>
            alphabet
          </div>
          <div style={{ display: "flex" }}>by hand.</div>
        </div>
        {/* Bottom rule + meta */}
        <div
          style={{
            position: "absolute",
            bottom: 56,
            left: 80,
            right: 80,
            height: 1,
            background: "#5c554a",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: 16,
            left: 80,
            right: 80,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontFamily: "ui-monospace, Menlo, monospace",
            fontSize: 20,
            letterSpacing: "0.06em",
            color: "#bcb29d",
          }}
        >
          <span>ASL fingerspelling · 24 letters · in-browser</span>
          <span>spellhand.vercel.app</span>
        </div>
      </div>
    ),
    { ...size },
  );
}
