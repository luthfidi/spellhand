import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./lib/i18n/request.ts");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Allow dev tooling (HMR, server actions, etc) when accessed from LAN IP
  // or a Cloudflare quick-tunnel domain. Dev-only; production ignores this.
  allowedDevOrigins: [
    "192.168.5.98",
    "*.trycloudflare.com",
    "*.ngrok-free.app",
    "*.ngrok.app",
  ],
  experimental: {
    optimizePackageImports: ["motion", "@mediapipe/tasks-vision"],
  },
  async headers() {
    return [
      {
        // ASL letter illustrations are immutable, version-pinned by filename.
        source: "/letters/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        // The SW must be re-validated on every load so a new version ships
        // promptly — never let the browser serve a stale sw.js from cache.
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "public, max-age=0, must-revalidate" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
    ];
  },
};

export default withNextIntl(nextConfig);
