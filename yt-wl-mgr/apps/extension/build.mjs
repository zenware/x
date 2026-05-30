import { rm } from "node:fs/promises";
import { build } from "esbuild";

const outdir = new URL("./dist/apps/extension/src/", import.meta.url);

await rm(outdir, { recursive: true, force: true });

await build({
  entryPoints: {
    background: "src/background.ts",
    popup: "src/popup.ts",
    catalog: "src/catalog.ts",
    "content/watchLaterSnapshot": "src/content/watchLaterSnapshot.ts"
  },
  absWorkingDir: new URL(".", import.meta.url).pathname,
  bundle: true,
  format: "iife",
  outdir: outdir.pathname,
  platform: "browser",
  sourcemap: true,
  target: ["safari16.4", "chrome109", "firefox115"]
});
