/**
 * S-4 review queue: what each flag kind MEANS and what the user may do about it.
 *
 * Pure and dependency-free on purpose (it is the copy + policy layer, and it is
 * unit-tested without a device). Three rules from D-013 / koi-core-spec §D5
 * shape every entry here:
 *
 *  - **Nothing is fixed silently.** Every entry names the record and states what
 *    happened in plain words; the user decides.
 *  - **Never offer what the architecture cannot deliver.** A delete wins
 *    visibility (D-043) and only the deleting device can undo it (D-040), so a
 *    review screen must NOT offer "restore" on a deleted record — re-entering
 *    the values as a new record is the honest affordance.
 *  - **A deleted row is not on the device at all** (bucket-filter, D-046), so
 *    entries about deleted records read from the flag payload
 *    (`displaced_value` / `incoming_value`), never from a local row.
 *
 * `ReviewAction` values are intents; the screen offers one only when the local
 * state supports it (`presence` below), so presence is discovered at runtime,
 * never assumed from the kind.
 */

export type ReviewAction =
  /** Resolve with no data write: "I have looked at this." */
  | 'mark-reviewed'
  /** Resolve and keep the value the server applied. */
  | 'keep-current'
  /** Write the flag's displaced value back onto the live row (a normal edit). */
  | 'restore-displaced'
  /** Open the record this flag points at (only when it is on the device). */
  | 'open-record'
  /** Re-enter the payload as a NEW record — the honest path for a deleted one. */
  | 're-enter';

/** Whether the flagged record is expected on the device (bucket-filter, D-046). */
export type FlagPresence = 'live' | 'deleted' | 'either';

export interface ReviewKind {
  readonly kind: string;
  /** Sentence-case headline, no record name (the screen adds it). */
  readonly title: string;
  /** What happened, in plain words — states facts, never scolds (§D6). */
  readonly what: string;
  /** What the user's options actually mean, when that is not obvious. */
  readonly note?: string;
  readonly presence: FlagPresence;
  readonly actions: readonly ReviewAction[];
}

const SYNC_KINDS: readonly ReviewKind[] = [
  {
    kind: 'column-conflict',
    title: 'Two devices changed the same field',
    what: 'Both edits arrived. Koi kept the one that arrived later and saved the other here.',
    note: 'Restoring writes the other value back as a normal edit.',
    presence: 'live',
    actions: ['keep-current', 'restore-displaced', 'open-record'],
  },
  {
    kind: 'missing-base-version',
    title: 'An edit arrived without its starting point',
    what: 'Koi applied the edit, but could not tell whether another device had changed the record first.',
    note: 'Open the record and check the values are the ones you meant.',
    presence: 'live',
    actions: ['open-record', 'mark-reviewed'],
  },
  {
    kind: 'put-on-existing',
    title: 'A whole record arrived for one that already existed',
    what: 'Koi applied the incoming values and saved the ones they replaced here.',
    presence: 'live',
    actions: ['keep-current', 'restore-displaced', 'open-record'],
  },
  {
    kind: 'resurrected',
    title: 'An undone record came back with different values',
    what: 'Koi restored the record and saved the values it replaced here.',
    presence: 'live',
    actions: ['keep-current', 'restore-displaced', 'open-record'],
  },
  {
    kind: 'delete-conflict',
    title: 'Deleted on one device, changed on another',
    what: 'The record is deleted. The change the other device made is kept here.',
    note: 'Koi cannot undo a delete from another device. You can enter the values again as a new record.',
    presence: 'deleted',
    actions: ['re-enter', 'mark-reviewed'],
  },
  {
    kind: 'edit-after-delete',
    title: 'Edited after it was deleted',
    what: 'The record was already deleted when the edit arrived. It stays deleted, and the edit is kept here.',
    note: 'Koi cannot undo a delete from another device. You can enter the values again as a new record.',
    presence: 'deleted',
    actions: ['re-enter', 'mark-reviewed'],
  },
  {
    kind: 'write-on-tombstone',
    title: 'A deleted record arrived again',
    what: 'A copy of a deleted record came back — from another device, a restore or an import. It stays deleted, and the values are kept here.',
    note: 'Koi never brings a record back on its own. You can enter the values again as a new record.',
    presence: 'deleted',
    actions: ['re-enter', 'mark-reviewed'],
  },
  {
    kind: 'late-child',
    title: 'A reading arrived for a deleted car',
    what: 'The car was already deleted, so the reading is kept as deleted too. Nothing was thrown away, and the car was not brought back.',
    note: 'You can enter the reading against one of your cars.',
    presence: 'deleted',
    actions: ['re-enter', 'mark-reviewed'],
  },
  {
    kind: 'dead-lettered-op',
    title: 'A change could not be applied',
    what: 'Koi kept the change exactly as it arrived, so nothing is lost, but it could not be applied to your records.',
    note: 'The details stay on the server. Nothing on this device is missing because of it.',
    presence: 'either',
    actions: ['mark-reviewed'],
  },
];

/**
 * @koi/domain violation kinds (flag-never-fix, inv.12): the value is stored as
 * the user entered it and the domain says why it looks wrong. The fix is always
 * the user's own edit — Koi never adjusts a reading.
 */
const DOMAIN_KINDS: readonly ReviewKind[] = [
  {
    kind: 'odometer-backwards',
    title: 'This reading is lower than an earlier one',
    what: 'An odometer only goes up, so one of the two readings has the wrong number or the wrong date.',
    presence: 'live',
    actions: ['open-record', 'mark-reviewed'],
  },
  {
    kind: 'odometer-ahead',
    title: 'This reading is higher than a later one',
    what: 'An odometer only goes up, so one of the two readings has the wrong number or the wrong date.',
    presence: 'live',
    actions: ['open-record', 'mark-reviewed'],
  },
  {
    kind: 'odometer-same-date-conflict',
    title: 'Two different readings on the same day',
    what: 'The same day carries two odometer values for this car.',
    presence: 'live',
    actions: ['open-record', 'mark-reviewed'],
  },
  {
    kind: 'odometer-invalid',
    title: 'This reading is out of range',
    what: 'An odometer reading has to be a whole number between 0 and 9,999,999 km.',
    presence: 'live',
    actions: ['open-record', 'mark-reviewed'],
  },
  {
    kind: 'car-year-out-of-range',
    title: "This car's year looks wrong",
    what: 'Koi expects a year from 1950 up to next year.',
    presence: 'live',
    actions: ['open-record', 'mark-reviewed'],
  },
  {
    kind: 'car-tank-out-of-range',
    title: 'This tank size looks wrong',
    what: 'Koi expects a tank between 10 and 200 litres.',
    presence: 'live',
    actions: ['open-record', 'mark-reviewed'],
  },
  {
    kind: 'car-odometer-out-of-range',
    title: "This car's starting odometer is out of range",
    what: 'A reading has to be a whole number between 0 and 9,999,999 km.',
    presence: 'live',
    actions: ['open-record', 'mark-reviewed'],
  },
];

export const REVIEW_KINDS: readonly ReviewKind[] = [...SYNC_KINDS, ...DOMAIN_KINDS];

const BY_KIND = new Map(REVIEW_KINDS.map((k) => [k.kind, k]));

/**
 * A kind this build has never seen (an older client against a newer server) is
 * still shown, with the server's own message doing the explaining — a flag must
 * never be silently dropped by the surface that exists to show it.
 */
export function reviewKind(kind: string): ReviewKind {
  return (
    BY_KIND.get(kind) ?? {
      kind,
      title: 'Something needs your attention',
      what: 'This app version does not recognise this kind of note yet, so it is shown as it arrived.',
      presence: 'either',
      actions: ['mark-reviewed'],
    }
  );
}

/** jsonb payloads arrive as `{"value": …}` (server-side `jsonWrap`). */
export function unwrapPayload(raw: string | null | undefined): unknown {
  if (raw == null || raw === '') return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (parsed !== null && typeof parsed === 'object' && 'value' in parsed) {
      return (parsed as { value: unknown }).value;
    }
    return parsed;
  } catch {
    // Evidence that will not parse is still evidence: show it verbatim.
    return raw;
  }
}

/** Column → value pairs from a snapshot payload, for the evidence rows. */
export function payloadEntries(value: unknown): readonly { column: string; value: unknown }[] {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return [];
  return Object.entries(value as Record<string, unknown>).map(([column, v]) => ({
    column,
    value: v,
  }));
}

/**
 * The one shape variance in the flag payload: `column-conflict` (D-037) writes
 * `displaced_value`/`incoming_value` as a bare SCALAR (one column, named by
 * `column_name`) — every other kind that ever sets `column_name`, in particular
 * `delete-conflict` (whose `column_name` is a joined list, D-043's per-column
 * scan of `planDelete`), writes an OBJECT snapshot, even when only one column
 * happens to be in it. Reading `column_name` alone to decide the shape mixes the
 * two up: a delete-conflict with exactly one conflicting column would otherwise
 * get nested a second time, under its own name. Both the restore write
 * (data/flags.ts) and the review-item display read the payload through this one
 * function so the two can never drift out of step with each other again.
 */
export function namedPayloadEntries(
  kind: string,
  columnName: string | null,
  value: unknown,
): readonly { column: string; value: unknown }[] {
  if (kind === 'column-conflict' && columnName !== null) {
    return [{ column: columnName, value }];
  }
  return payloadEntries(value);
}
