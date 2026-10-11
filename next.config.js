/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Standalone output keeps the Cloud Run image small.
  output: "standalone",
  // three/drei ship untranspiled ESM; let Next transpile them.
  transpilePackages: ["three", "@react-three/fiber", "@react-three/drei"],
};

module.exports = nextConfig;
