// Bountyline — a make.fun frontend (program/v1, Node 22, standard library only).
//
// The entry is the static app in app/ plus three screenshots of it running on
// live data. This program hands them in: it copies app/ and screenshots/ from
// beside this file to /output and writes /output/dossier.json, the summary the
// judge reads (the screenshots, the first load's files and bytes, and the
// source), with the vendored make.fun dossier library. Leave
// vendor/makefun-frontend.ts exactly as the kit ships it: the scorer rebuilds
// the dossier with its own identical copy and requires a byte-for-byte match.
//
// Run it locally (MAKEFUN_OUTPUT_DIR stands in for /output outside the grader):
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// Serve the app itself with `node serve.ts`, then open http://localhost:8080.

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

const appDir = join(repoRoot, 'app');
const shotsDir = join(repoRoot, 'screenshots');

mkdirSync(outDir, { recursive: true });
cpSync(appDir, join(outDir, 'app'), { recursive: true });
mkdirSync(join(outDir, 'screenshots'), { recursive: true });
if (existsSync(shotsDir)) {
  cpSync(shotsDir, join(outDir, 'screenshots'), { recursive: true });
}

// The scorer's own caps (reference/gate.json): only text_max_bytes shapes the
// bytes; the others refuse an entry the scorer would refuse — more than 3
// screenshots or one over 256 KiB; more than 993 files and directories in
// app/ or 16 MiB of app files (app/ counts beside /output's own 1000-entry
// cap, its screenshots/ and dossier.json).
writeFileSync(
  join(outDir, 'dossier.json'),
  buildDossier(outDir, {
    text_max_bytes: 163840,
    screenshots: { max: 3, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 16777216,
  }),
);
