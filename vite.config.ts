import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { nitro } from "nitro/vite";

const nitroPreset = process.env.NITRO_PRESET ?? "cloudflare_module";
const isCloudflare = nitroPreset === "cloudflare_module";

export default defineConfig({
  plugins: [
    tailwindcss(),
    tsConfigPaths({ projects: ["./tsconfig.json"] }),
    tanstackStart({
      server: { entry: "server" },
      importProtection: {
        behavior: "error",
        client: {
          files: ["**/server/**"],
          specifiers: ["server-only"],
        },
      },
    }),
    nitro({
      preset: nitroPreset,
      ...(isCloudflare
        ? {
            output: {
              dir: "dist",
              serverDir: "dist/server",
              publicDir: "dist/client",
            },
            cloudflare: { nodeCompat: true, deployConfig: true },
          }
        : {}),
    }),
    react(),
  ],
  resolve: {
    alias: { "@": `${process.cwd()}/src` },
    dedupe: [
      "react",
      "react-dom",
      "react/jsx-runtime",
      "react/jsx-dev-runtime",
      "@tanstack/react-query",
      "@tanstack/query-core",
    ],
  },
  server: {
    host: "::",
    port: 8080,
  },
});
