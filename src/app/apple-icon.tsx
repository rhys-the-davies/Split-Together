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
          background: "#3B82F6",
          borderRadius: "40px",
        }}
      >
        <span
          style={{
            color: "white",
            fontSize: "72px",
            fontWeight: 700,
            fontFamily: "sans-serif",
            letterSpacing: "-2px",
          }}
        >
          ST
        </span>
      </div>
    ),
    size
  );
}
