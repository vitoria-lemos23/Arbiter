import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // @arbiter/db is consumed as TypeScript source, so Next must transpile it.
  transpilePackages: ["@arbiter/db"],
};

export default nextConfig;
