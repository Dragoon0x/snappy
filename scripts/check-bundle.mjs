#!/usr/bin/env node
/**
 * Bundle size budget check.
 *
 * Parses the gzipped sizes of every chunk in dist/assets/ and fails if the
 * total (or any single chunk) exceeds the configured budget.
 *
 * Budgets are measured in kilobytes GZIPPED (closer to what users download).
 *
 * Run after `vite build`.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import zlib from "node:zlib";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.resolve(__dirname, "..", "dist");
const ASSETS = path.join(DIST, "assets");

/** KB budgets (gzipped). Tune as the app grows. */
const BUDGETS = {
  /** Default per-chunk ceiling. The three.js vendor chunk has a dedicated higher limit below. */
  anyChunkJs: 110,
  /** Every individual CSS file. */
  anyChunkCss: 20,
  /** Sum of all JS chunks (entry + vendor + routes + workers). */
  totalJs: 560,
  /** Editor entry chunk specifically (excludes konva / react / three). */
  editorEntry: 60,
  /** Three.js vendor chunk is lazy-loaded on 3D mode. Allow headroom. */
  threeChunk: 200,
  /** r3f + drei chunk (fiber, drei helpers, postprocessing). */
  r3fChunk: 160,
};

/** Patterns that get a dedicated per-chunk budget. */
const CHUNK_OVERRIDES = [
  { match: /^three-/, budget: () => BUDGETS.threeChunk, label: "three chunk" },
  { match: /^three-r3f-/, budget: () => BUDGETS.r3fChunk, label: "r3f chunk" },
];

function gzipSize(filePath) {
  const buf = fs.readFileSync(filePath);
  return zlib.gzipSync(buf, { level: 9 }).length;
}

function kb(bytes) {
  return +(bytes / 1024).toFixed(1);
}

function main() {
  if (!fs.existsSync(ASSETS)) {
    console.error("dist/assets not found. Run `vite build` first.");
    process.exit(1);
  }

  const files = fs.readdirSync(ASSETS).filter((f) => !f.endsWith(".map"));
  const report = [];
  let totalJs = 0;
  const failures = [];

  for (const file of files) {
    const full = path.join(ASSETS, file);
    const stat = fs.statSync(full);
    if (!stat.isFile()) continue;
    const size = gzipSize(full);
    report.push({ file, kb: kb(size) });

    if (file.endsWith(".js")) {
      totalJs += size;
      const override = CHUNK_OVERRIDES.find((o) => o.match.test(file));
      const limit = override ? override.budget() : BUDGETS.anyChunkJs;
      if (kb(size) > limit) {
        failures.push(
          `chunk ${file} = ${kb(size)} KB gz > ${limit} KB${override ? " (" + override.label + ")" : ""} budget`,
        );
      }
      if (/^index-/.test(file) && kb(size) > BUDGETS.editorEntry) {
        failures.push(
          `editor entry ${file} = ${kb(size)} KB gz > ${BUDGETS.editorEntry} KB budget`,
        );
      }
    }
    if (file.endsWith(".css")) {
      if (kb(size) > BUDGETS.anyChunkCss) {
        failures.push(`css ${file} = ${kb(size)} KB gz > ${BUDGETS.anyChunkCss} KB budget`);
      }
    }
  }

  const totalJsKb = kb(totalJs);
  if (totalJsKb > BUDGETS.totalJs) {
    failures.push(`total JS gz ${totalJsKb} KB > ${BUDGETS.totalJs} KB budget`);
  }

  report.sort((a, b) => b.kb - a.kb);
  console.log("\nBundle size report (gz, KB):\n");
  for (const r of report) {
    const type = r.file.endsWith(".js") ? "js " : r.file.endsWith(".css") ? "css" : "   ";
    console.log(`  ${type}  ${r.kb.toFixed(1).padStart(6)}   ${r.file}`);
  }
  console.log(`\n  total js gz: ${totalJsKb.toFixed(1)} KB / ${BUDGETS.totalJs} KB budget`);

  if (failures.length > 0) {
    console.error("\nBUDGET FAILURES:");
    for (const f of failures) console.error("  " + f);
    process.exit(1);
  }
  console.log("\nAll bundle budgets pass.\n");
}

main();
