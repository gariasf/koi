#!/usr/bin/env node
// Golden-vector conformance runner (Spike Ⓒ discipline, D-025/D-030).
//
// Bundles conformance/main.ts (esbuild, IIFE, es2017) and executes it under
// one or more JS engines, comparing stdout byte-for-byte against
// conformance/golden.json (md5 f93b1d6b1717043d97f16b0a17416681).
//
//   node scripts/run-conformance.mjs node            # V8
//   node scripts/run-conformance.mjs node jsc hermes # tri-engine (macOS dev)
//
// Engines:
//   node    this Node binary (V8)
//   jsc     macOS system JavaScriptCore CLI
//   hermes  $HERMES_BIN, or ~/.jsvu/bin/hermes (jsvu install)
//
// A missing engine binary is a hard failure — CI must never green-skip an
// engine it promised to check. The on-device RN-bundled Hermes run is a
// separate, still-owed step (BOARD bucket C) that lands with @koi/mobile.
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildSync } from 'esbuild';

const packageRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const bundlePath = join(packageRoot, 'dist-conformance', 'vectors.bundle.js');
const goldenPath = join(packageRoot, 'conformance', 'golden.json');
const golden = readFileSync(goldenPath, 'utf8');

const JSC_PATH = '/System/Library/Frameworks/JavaScriptCore.framework/Versions/Current/Helpers/jsc';

buildSync({
  entryPoints: [join(packageRoot, 'conformance', 'main.ts')],
  bundle: true,
  format: 'iife',
  target: 'es2017',
  outfile: bundlePath,
  logLevel: 'warning',
});

function engineCommand(name) {
  switch (name) {
    case 'node':
      return process.execPath;
    case 'jsc':
      return JSC_PATH;
    case 'hermes':
      return process.env.HERMES_BIN ?? join(homedir(), '.jsvu', 'bin', 'hermes');
    default:
      throw new Error(`unknown engine: ${name} (expected node | jsc | hermes)`);
  }
}

const engines = process.argv.slice(2);
if (engines.length === 0) engines.push('node');

let failed = false;
for (const engine of engines) {
  const command = engineCommand(engine);
  if (!existsSync(command)) {
    console.error(`FAIL ${engine} — engine binary not found at ${command}`);
    failed = true;
    continue;
  }
  let output;
  try {
    output = execFileSync(command, [bundlePath], { encoding: 'utf8' });
  } catch (error) {
    console.error(`FAIL ${engine} — engine exited abnormally: ${error.message}`);
    failed = true;
    continue;
  }
  const md5 = createHash('md5').update(output).digest('hex');
  const ok = output === golden;
  console.log(`${ok ? 'PASS' : 'FAIL'} ${engine}  md5=${md5}  bytes=${Buffer.byteLength(output, 'utf8')}`);
  if (!ok) failed = true;
}

if (failed) {
  console.error('golden-vector divergence or missing engine: output must be byte-identical to conformance/golden.json');
  process.exit(1);
}
