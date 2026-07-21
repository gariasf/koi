/**
 * Conformance entrypoint: bundled by esbuild (IIFE, es2017) into a single
 * file runnable unchanged under Node (V8), the macOS `jsc` CLI (JavaScriptCore)
 * and standalone Hermes. Prints exactly one line: the canonical vector JSON.
 *
 * `print` exists in the jsc/hermes shells; Node gets console.log via
 * globalThis (a bare `console` identifier trips a Hermes compile warning).
 */
import { renderCanonicalVectors } from './vectors.js';

declare const print: ((value: string) => void) | undefined;

interface ConsoleLike {
  console?: { log: (value: string) => void };
}

const emit =
  typeof print !== 'undefined' ? print : (globalThis as ConsoleLike).console?.log;

if (emit === undefined) {
  throw new Error('no print/console.log available in this engine');
}
emit(renderCanonicalVectors());
