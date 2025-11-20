const runtimeCaching = require("next-pwa/cache");
const withPWA = require("next-pwa")({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
  runtimeCaching,
  buildExcludes: ["middleware-manifest.json", "_next/image/*"],
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  async headers() {
    return [
      {
        source: "/",
        headers: [
          { key: "Cache-Control", value: "no-store" },
        ],
      },
      {
        source: "/home",
        headers: [
          { key: "Cache-Control", value: "no-store" },
        ],
      },
    ];
  },
};

module.exports = withPWA(nextConfig);
