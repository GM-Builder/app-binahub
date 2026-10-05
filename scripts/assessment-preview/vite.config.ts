import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  root: path.resolve(__dirname),
  plugins: [react()],
  resolve: { alias: [
    { find: "@/lib/supabase", replacement: path.resolve(__dirname, "mock-supabase.ts") },
    { find: "@", replacement: path.resolve(__dirname, "../../src") },
  ] },
  // No production credentials, API proxy, or auth bypass. Loopback only.
  envDir: path.resolve(__dirname),
  server: { host: "127.0.0.1", port: 4318, strictPort: true },
});
