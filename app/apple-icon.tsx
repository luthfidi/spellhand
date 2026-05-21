import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#1a1612",
          color: "#d8f567",
          fontFamily: "Georgia, serif",
          fontStyle: "italic",
          fontSize: 130,
          lineHeight: 1,
        }}
      >
        S
      </div>
    ),
    size,
  );
}
