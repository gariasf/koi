/**
 * Postgres rejects U+0000 anywhere in text and jsonb (22021/22P05). Client
 * payloads can legally carry it through JSON — and the dead-letter path is
 * the one place a write failure must never cascade (a throwing
 * recordDeadLetter aborts the whole batch and permanently wedges the
 * client's queue on retry). Every value headed for a jsonb/text column that
 * originates from client content passes through here; U+0000 becomes U+FFFD.
 */

// eslint-disable-next-line no-control-regex -- matching NUL is the whole point
const NUL = /\u0000/g;

export function sanitizeText(value: string): string {
  return value.replace(NUL, '�');
}

export function sanitizeJson(value: unknown): unknown {
  if (typeof value === 'string') return sanitizeText(value);
  if (Array.isArray(value)) return value.map(sanitizeJson);
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([k, v]) => [
        sanitizeText(k),
        sanitizeJson(v),
      ]),
    );
  }
  return value;
}
