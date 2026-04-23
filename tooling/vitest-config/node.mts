import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import tsconfigPaths from "vite-tsconfig-paths";
import { configDefaults, defineConfig } from "vitest/config";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const repoRoot = resolve(__dirname, "../..");

const srcRoot = resolve(repoRoot, "src");

export default defineConfig({
  root: srcRoot,

  plugins: [
    tsconfigPaths({
      projects: [resolve(srcRoot, "tsconfig.json")],
    }),
  ],

  resolve: {
    alias: {
      "jest-cucumber": "@amiceli/vitest-cucumber",
    },
  },

  test: {
    environment: "node",
    globals: true,

    include: [
      "modules/**/*.spec.{ts,tsx,js,jsx}",
      "modules/**/*.test.{ts,tsx,js,jsx}",
      "**/*.spec.{ts,tsx,js,jsx}",
      "**/*.test.{ts,tsx,js,jsx}",
    ],

    exclude: [
      ...configDefaults.exclude,
      "tooling/**",
      "node_modules/**",
      "dist/**",
      "build/**",
    ],
  },
});
