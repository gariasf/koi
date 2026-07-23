/**
 * Wire shapes for the upload path. The connector (client) maps PowerSync
 * CrudEntry → { op, type, id, data: opData, old: previousValues } and posts
 * { deviceId, batch }.
 *
 * Malformed BODY shape (not content) is a broken client build, not user
 * data — it is answered 400 so the client retries visibly rather than
 * losing its queue. Accept-with-2xx applies to well-formed protocol whose
 * CONTENT the server cannot apply; that content is dead-lettered + flagged,
 * never skipped (Spike ② rule).
 *
 * Table data schemas are STRICT: an unknown column (e.g. a newer client
 * against an older server) dead-letters the whole op instead of silently
 * stripping fields — the S-10 stance on the server side.
 *
 * EXCEPT server-managed columns that sync DOWN: `record_version` (S-2) and
 * `deleted_at` (S-6) legitimately appear in a client's local row, so a
 * re-INSERT (the undo/restore PUT) or a full-row PUT carries them in opData.
 * They are KNOWN server columns, not unknown-newer-client columns — the schemas
 * accept them and the handlers ignore them (never in `writableColumns`), so the
 * undo path is not a dead-letter trap while the S-10 strictness stands for
 * genuinely unknown fields. The server owns the tombstone lifecycle through the
 * DELETE (tombstone) and PUT (resurrect) ops, never through client-sent
 * `deleted_at` data.
 */

import { z } from 'zod';

/** Accepted-and-ignored on every table op: server-managed columns clients mirror. */
const serverManaged = {
  record_version: z.unknown().optional(),
  deleted_at: z.unknown().optional(),
};

export const crudEntrySchema = z.object({
  op: z.enum(['PUT', 'PATCH', 'DELETE']),
  type: z.string().min(1),
  id: z.string().min(1),
  data: z.record(z.string(), z.unknown()).optional(),
  old: z.record(z.string(), z.unknown()).optional(),
});
export type UploadEntry = z.infer<typeof crudEntrySchema>;

export const uploadBodySchema = z.object({
  deviceId: z.string().min(1),
  batch: z.array(crudEntrySchema),
});
export type UploadBody = z.infer<typeof uploadBodySchema>;

export const tokenBodySchema = z.object({ username: z.string().min(1).default('owner') });

/** koi-core-spec.md §B1 fuel types, lowercase canonical. */
const fuelType = z.enum([
  'petrol',
  'diesel',
  'electric',
  'hybrid',
  'mild-hybrid',
  'plugin-hybrid',
  'lpg',
  'cng',
  'other',
]);

const carFields = {
  household_id: z.string().min(1).nullish(),
  make: z.string().min(1),
  model: z.string().min(1),
  nickname: z.string().nullish(),
  plate: z.string().nullish(),
  fuel_type: fuelType,
  year: z.number().int().nullish(),
  tank_capacity_l: z.number().int().nullish(),
  initial_odometer_km: z.number().int().nullish(),
};

export const carPutSchema = z.strictObject({ ...carFields, ...serverManaged });
// household moves are not a supported edit — a PATCH carrying household_id
// dead-letters loudly instead of silently re-homing a record (S-14 keeps the
// column; a future sharing flow adds the handler).
export const carPatchSchema = carPutSchema.omit({ household_id: true }).partial();

const readingFields = {
  household_id: z.string().min(1).nullish(),
  car_id: z.string().min(1),
  reading_km: z.number().int(),
  recorded_date: z.string().min(1),
  /** Nullable on purpose: §B1 `source?` — nil reads as legacy. */
  source: z.string().min(1).nullish(),
  device_id: z.string().nullish(),
};

export const readingPutSchema = z.strictObject({ ...readingFields, ...serverManaged });
// A reading never changes car or household — re-parenting is not a product
// flow (edits touch km/date/source only), and excluding car_id keeps the
// lock discipline single-car.
export const readingPatchSchema = readingPutSchema
  .omit({ household_id: true, car_id: true })
  .partial();

/** The record_version echo from CrudEntry.previousValues; null when absent/garbled. */
export function extractBaseVersion(old: Record<string, unknown> | undefined): number | null {
  const raw = old?.['record_version'];
  const n = typeof raw === 'string' ? Number(raw) : raw;
  return typeof n === 'number' && Number.isInteger(n) && n >= 1 ? n : null;
}

/** Compact, content-free zod error summary (no user data in logs or flags). */
export function summarizeIssues(error: z.ZodError): string {
  return error.issues
    .map((i) => `${i.path.join('.') || '(root)'}: ${i.code}`)
    .sort()
    .join('; ');
}
