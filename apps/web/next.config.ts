import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Workspace packages are consumed as TypeScript source, so Next must
  // transpile them. This also applies the `.js` -> `.ts` extension aliasing
  // that lets @arbiter/contracts' Node-style ESM imports resolve.
  transpilePackages: ["@arbiter/db", "@arbiter/contracts"],
};

export default nextConfig;
