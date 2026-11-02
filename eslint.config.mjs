// Evaluate before plugin imports so their legacy CommonJS calls use patched v11.
import "./tools/minimatch-compat.mjs";
import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    ".codex_tmp/**",
    ".impeccable/review/**",
    "coverage/**",
    "test-results/**",
    "playwright-report/**",
    "tmp/**",
    "output/**",
  ]),
]);

export default eslintConfig;
