import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 180,
          height: 180,
          background: "#4f46e5",
          borderRadius: 40,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "sans-serif",
          fontWeight: 700,
          fontSize: 72,
          color: "white",
          letterSpacing: "-2px",
        }}
      >
        KR
      </div>
    ),
    { ...size }
  );
}
