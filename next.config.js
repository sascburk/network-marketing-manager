/** @type {import('next').NextConfig} */
const nextConfig = {
  // Standalone output -> kleines Docker-Image, laeuft ohne volle node_modules.
  output: "standalone",
  // Hinter dem Cosmos-Cloud Reverse-Proxy: TLS wird am Proxy terminiert.
  // Die App spricht intern nur HTTP und vertraut X-Forwarded-* Headern.
  poweredByHeader: false,
  reactStrictMode: true,
  eslint: {
    // Builds sollen nicht an Lint-Warnungen scheitern (Deploy-Robustheit).
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;
