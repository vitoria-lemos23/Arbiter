import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      // `server-only` is a Next.js bundler alias, not a real dependency — stub it
      // so server modules are importable under Vitest's node environment.
      "server-only": fileURLToPath(
        new URL("./src/test/serverOnlyStub.ts", import.meta.url),
      ),
    },
  },
});
