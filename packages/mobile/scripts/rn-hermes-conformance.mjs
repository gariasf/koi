#!/usr/bin/env node
// The golden vectors on the Hermes React Native actually ships (BOARD bucket C).
//
// Spike Ⓒ locked the vectors byte-identical across V8, JSC and Hermes, but the
// Hermes in that proof — and in CI's `conformance` job — is the one `jsvu`
// installs, i.e. the newest facebook/hermes GitHub *release*. That release is
// v0.13.0, whose binaries self-report Hermes 0.12.0 and **HBC bytecode 96**,
// while React Native 0.86 ships **HBC 98**. The gap is not cosmetic: hand the
// jsvu VM bytecode from RN's compiler and it refuses to run it. So that job is a
// cross-engine canary, and this script is the discharge.
//
// What it proves, and how:
//
//   1. **Which Hermes RN ships** — read from the installed react-native
//      (`sdks/.hermesv1version`), cross-checked against react-native's own
//      `hermes-compiler` dependency pin and the version on disk. An Expo/RN bump
//      that moves the engine fails here loudly instead of quietly testing the
//      wrong one.
//   2. **Engine identity** — the VM under test is built from that exact
//      facebook/hermes tag, and its own `hermesc` is asserted to emit
//      byte-identical bytecode to the `hermesc` react-native ships, at the same
//      HBC version. Same compiler output + same bytecode version = same engine,
//      asserted rather than assumed.
//   3. **The vectors** — compiled to bytecode by RN's own `hermesc` and executed
//      on that VM, then compared byte-for-byte to `conformance/golden.json`. The
//      plain-source path runs too, so a bytecode-only divergence is visible.
//
// What it still does NOT prove, stated plainly: the platform Unicode provider.
// A Linux host Hermes uses PlatformUnicodeICU, Android uses PlatformUnicodeJava
// and Apple uses PlatformUnicodeCF, and `@koi/domain`'s ordering calls
// `String.prototype.normalize('NFC')`. Only a device/emulator run closes that,
// and until it exists the honest claim is "the engine and the bytecode pipeline
// are RN's; the ICU provider on a device is not covered here."
//
// Usage:
//   KOI_RN_HERMES_BIN=/path/to/hermes node scripts/rn-hermes-conformance.mjs
//
// The bundle comes from @koi/domain's own runner, so run that first:
//   pnpm --filter @koi/domain conformance

import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const mobileRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const domainRoot = join(mobileRoot, '..', 'domain');
const bundlePath = join(domainRoot, 'dist-conformance', 'vectors.bundle.js');
const goldenPath = join(domainRoot, 'conformance', 'golden.json');
const workDir = join(mobileRoot, 'dist-conformance');

const fail = (message) => {
  console.error(`FAIL ${message}`);
  process.exitCode = 1;
};

const hbcVersion = (binary) => {
  const out = execFileSync(binary, ['-version'], { encoding: 'utf8' });
  const match = /HBC bytecode version:\s*(\d+)/.exec(out);
  return match?.[1] ?? null;
};

// ── 1. Which Hermes does the installed react-native ship? ────────────────────
const req = createRequire(join(mobileRoot, 'noop.cjs'));
const rnPkgPath = req.resolve('react-native/package.json');
const rnDir = dirname(rnPkgPath);
const rnPkg = JSON.parse(readFileSync(rnPkgPath, 'utf8'));

// Hermes V1 is RN's shipped default (the gradle plugin's hermesV1Enabled has
// convention(true); the podspec opts out only on RCT_HERMES_V1_ENABLED=0), so
// .hermesv1version is the engine unless the app deliberately opts out.
const usesV1 = process.env['KOI_HERMES_V1'] !== '0';
const tagFile = join(rnDir, 'sdks', usesV1 ? '.hermesv1version' : '.hermesversion');
if (!existsSync(tagFile)) fail(`react-native ${rnPkg.version} has no ${tagFile}`);
const hermesTag = existsSync(tagFile) ? readFileSync(tagFile, 'utf8').trim() : 'unknown';

const compilerPin = rnPkg.dependencies?.['hermes-compiler'];
if (compilerPin === undefined) {
  fail('react-native declares no hermes-compiler dependency (expected RN >= 0.84)');
} else if (usesV1 && hermesTag !== `hermes-v${compilerPin}`) {
  fail(`drift: sdks/.hermesv1version=${hermesTag} but react-native pins hermes-compiler@${compilerPin}`);
}

// hermes-compiler is react-native's own dependency: under pnpm's isolated linker
// it is reachable only from react-native, never from this package.
let rnHermesc = null;
let installedCompiler = null;
try {
  const hcPkgPath = createRequire(rnPkgPath).resolve('hermes-compiler/package.json');
  installedCompiler = JSON.parse(readFileSync(hcPkgPath, 'utf8')).version;
  const hostBin = process.platform === 'darwin' ? 'osx-bin' : 'linux64-bin';
  rnHermesc = join(dirname(hcPkgPath), 'hermesc', hostBin, 'hermesc');
} catch {
  fail('could not resolve hermes-compiler from react-native');
}
if (installedCompiler !== null && compilerPin !== undefined && installedCompiler !== compilerPin) {
  fail(`drift: installed hermes-compiler@${installedCompiler} != react-native's pin ${compilerPin}`);
}
if (rnHermesc !== null && !existsSync(rnHermesc)) fail(`RN's hermesc is missing at ${rnHermesc}`);

// ── 2. The VM built from that tag, and its identity ─────────────────────────
const vm = process.env['KOI_RN_HERMES_BIN'];
if (vm === undefined || vm === '') {
  fail('KOI_RN_HERMES_BIN is not set — it must point at a Hermes VM built from ' + hermesTag);
}
const vmPath = vm === undefined ? null : resolve(vm);
if (vmPath !== null && !existsSync(vmPath)) fail(`no Hermes VM at ${vmPath}`);
// The from-source build produces the VM and its compiler side by side.
const vmHermesc = vmPath === null ? null : join(dirname(vmPath), 'hermesc');

console.log(`react-native ${rnPkg.version} ships ${hermesTag} (hermes-compiler ${String(installedCompiler)})`);

if (process.exitCode === 1) {
  console.error('cannot verify the RN-bundled Hermes — see the failures above');
  process.exit(1);
}

mkdirSync(workDir, { recursive: true });

const rnHbcVersion = hbcVersion(rnHermesc);
const vmHbcVersion = hbcVersion(vmPath);
if (rnHbcVersion === null || vmHbcVersion === null) {
  fail('could not read an HBC bytecode version from one of the binaries');
} else if (rnHbcVersion !== vmHbcVersion) {
  fail(
    `bytecode versions differ: RN's hermesc is HBC ${rnHbcVersion}, the VM is HBC ${vmHbcVersion} — not the same engine`,
  );
} else {
  console.log(`PASS bytecode version  HBC ${rnHbcVersion} on both RN's hermesc and the VM`);
}

// Compiler identity: same input, byte-identical bytecode out. (No source maps —
// -output-source-map changes the emitted bytecode.)
if (existsSync(vmHermesc ?? '')) {
  const probeJs = join(workDir, 'identity-probe.js');
  writeFileSync(probeJs, 'print("identity probe");\n');
  const rnOut = join(workDir, 'identity-probe.rn.hbc');
  const vmOut = join(workDir, 'identity-probe.vm.hbc');
  execFileSync(rnHermesc, ['-emit-binary', '-out', rnOut, probeJs]);
  execFileSync(vmHermesc, ['-emit-binary', '-out', vmOut, probeJs]);
  const rnHash = createHash('sha256').update(readFileSync(rnOut)).digest('hex');
  const vmHash = createHash('sha256').update(readFileSync(vmOut)).digest('hex');
  if (rnHash !== vmHash) {
    fail(`the VM's compiler and RN's hermesc disagree on bytecode (${rnHash} vs ${vmHash})`);
  } else {
    console.log(`PASS compiler identity  byte-identical bytecode (sha256 ${rnHash.slice(0, 16)}…)`);
  }
} else {
  fail(`no hermesc beside the VM at ${String(vmHermesc)} — cannot assert compiler identity`);
}

// ── 3. The vectors, on that VM ──────────────────────────────────────────────
if (!existsSync(bundlePath)) {
  fail(`no conformance bundle at ${bundlePath} — run: pnpm --filter @koi/domain conformance`);
  process.exit(1);
}
const golden = readFileSync(goldenPath, 'utf8');

const check = (label, argv) => {
  let output;
  try {
    output = execFileSync(vmPath, argv, { encoding: 'utf8' });
  } catch (error) {
    // Hermes exits 1 on an uncaught JS error and 5 on "Wrong bytecode version".
    fail(`${label} — the VM exited abnormally: ${error.message}`);
    return;
  }
  const md5 = createHash('md5').update(output).digest('hex');
  if (output !== golden) {
    fail(`${label} — golden-vector divergence (md5 ${md5})`);
    return;
  }
  console.log(`PASS ${label}  md5=${md5}  bytes=${Buffer.byteLength(output, 'utf8')}`);
};

check('vectors from source', [bundlePath]);

const hbcPath = join(workDir, 'vectors.rn-hermesc.hbc');
execFileSync(rnHermesc, ['-emit-binary', '-out', hbcPath, bundlePath]);
check("vectors as RN's own bytecode", [hbcPath]);

if (process.exitCode === 1) {
  console.error(
    'the vectors do not hold on the Hermes React Native ships: a cross-engine convergence event to investigate, never a fixture to update',
  );
  process.exit(1);
}
