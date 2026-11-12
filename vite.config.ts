import { fileURLToPath, URL } from "node:url";

import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { defineConfig, loadEnv } from "vite";
import tsConfigPaths from "vite-tsconfig-paths";

// Never set ssr.external or resolve.external: the Cloudflare Worker has no runtime module
// resolution, so the build fails. Never add response compression: Cloudflare already
// compresses at the edge.
export default defineConfig(({ command, mode }) => {
  // Expose VITE_* variables from .env files to both client and server bundles.
  const env = loadEnv(mode, process.cwd(), "VITE_");
  const envDefine = Object.fromEntries(
    Object.entries(env).map(([key, value]) => [`import.meta.env.${key}`, JSON.stringify(value)]),
  );

  return {
    define: envDefine,
    plugins: [
      tailwindcss(),
      tsConfigPaths({ projects: ["./tsconfig.json"] }),
      tanstackStart({
        // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
        server: { entry: "server" },
        // Keep server-only code out of the browser bundle.
        importProtection: {
          behavior: "error",
          client: {
            files: ["**/server/**"],
            specifiers: ["server-only"],
          },
        },
      }),
      // Nitro packages the production server; it is only needed for builds. It detects the host
      // it builds on (e.g. Vercel) and falls back to a Cloudflare Worker elsewhere;
      // NITRO_PRESET overrides both.
      ...(command === "build" ? [nitro({ defaultPreset: "cloudflare-module" })] : []),
      viteReact(),
    ],
    resolve: {
      alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
      dedupe: [
        "react",
        "react-dom",
        "react/jsx-runtime",
        "react/jsx-dev-runtime",
        "@tanstack/react-query",
        "@tanstack/query-core",
      ],
    },
    // Pre-bundle these at startup so a late dependency discovery can't re-optimize React
    // mid-session and leave the browser with two React copies ("null useCallback").
    optimizeDeps: {
      include: [
        "react",
        "react-dom",
        "react-dom/client",
        "react/jsx-runtime",
        "react/jsx-dev-runtime",
        "zustand",
        "zustand/middleware",
        "sonner",
        "lucide-react",
        "@radix-ui/react-dialog",
        "@radix-ui/react-slot",
        "class-variance-authority",
        "clsx",
        "tailwind-merge",
      ],
    },
    server: {
      host: "::",
      port: 8080,
    },
  };
});
