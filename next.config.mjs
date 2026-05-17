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
};

export default withNextIntl(nextConfig);
