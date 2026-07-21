/**
 * @koi/domain — Koi's pure domain core.
 *
 * Dependency-free, deterministic, engine-agnostic: the same inputs produce
 * byte-identical results under V8, JSC and Hermes (Spike Ⓒ, D-030). Runs
 * client-side on every write and server-side on every upload (D-022):
 * "flag, never fix". Purity is enforced by ESLint bans (see eslint.config.js)
 * and the golden-vector conformance suite (conformance/).
 */

export {
  parseAmount,
  formatAmount,
  toMinorUnits,
  isSafeMinorUnits,
  sumMinorUnits,
} from './money.js';
export type { NumberSeparators } from './money.js';

export { economyL100km } from './economy.js';

export {
  isLeapYear,
  daysInMonth,
  parseCivilDate,
  isCivilDate,
  formatCivilDate,
  toOrdinal,
  fromOrdinal,
  addDays,
  compareCivilDates,
  cycleAnchor,
} from './civil-date.js';
export type { CivilDate, CivilDateParts } from './civil-date.js';

export {
  normalizeNfc,
  compareCodePoints,
  compareForMerge,
  sortForMerge,
} from './ordering.js';

export { isUuidV7, compareIds, sortIds } from './ids.js';
export type { Uuid, IdSource } from './ids.js';
