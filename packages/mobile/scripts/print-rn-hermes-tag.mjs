#!/usr/bin/env node
// Prints the facebook/hermes tag the INSTALLED react-native ships, as
// `tag=hermes-v…` lines for GITHUB_OUTPUT. CI builds the VM from this tag and
// keys its build cache on it, so an Expo/RN bump rebuilds the right engine
// instead of silently reusing the old one.
//
// The cross-checks that make a drifted pin a hard failure live in
// rn-hermes-conformance.mjs; this script only reports.

import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const mobileRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const req = createRequire(join(mobileRoot, 'noop.cjs'));
const rnPkgPath = req.resolve('react-native/package.json');

// Hermes V1 is RN's shipped default; KOI_HERMES_V1=0 mirrors the app opting out.
const file = join(
  dirname(rnPkgPath),
  'sdks',
  process.env['KOI_HERMES_V1'] === '0' ? '.hermesversion' : '.hermesv1version',
);
if (!existsSync(file)) {
  console.error(`FAIL no Hermes version file at ${file}`);
  process.exit(1);
}

console.log(`tag=${readFileSync(file, 'utf8').trim()}`);
