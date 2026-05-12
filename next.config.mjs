/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    optimizePackageImports: ["motion", "@mediapipe/tasks-vision"],
  },
};

export default nextConfig;
