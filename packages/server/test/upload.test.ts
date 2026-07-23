import { describe, expect, it } from 'vitest';

import { isRetryable } from '../src/sync/upload.js';

/**
 * Retryable-error classification (the fix for the deadlock → terminal-dead-letter
 * data-loss defect): a transient Postgres contention/infra error must be
 * rethrown so the batch retries idempotently, never dead-lettered. A
 * deterministic content error must NOT be treated as retryable.
 */
describe('isRetryable — transient Postgres errors must retry, not dead-letter', () => {
  it('treats deadlock / serialization / lock-not-available as retryable', () => {
    expect(isRetryable({ code: '40P01' })).toBe(true); // deadlock_detected
    expect(isRetryable({ code: '40001' })).toBe(true); // serialization_failure
    expect(isRetryable({ code: '55P03' })).toBe(true); // lock_not_available
  });

  it('treats connection-class (08*) errors as retryable', () => {
    expect(isRetryable({ code: '08006' })).toBe(true); // connection_failure
    expect(isRetryable({ code: '08003' })).toBe(true); // connection_does_not_exist
  });

  it('reads the SQLSTATE from a wrapped cause', () => {
    expect(isRetryable({ cause: { code: '40P01' } })).toBe(true);
  });

  it('does NOT retry deterministic content errors — they must dead-letter', () => {
    expect(isRetryable({ code: '23505' })).toBe(false); // unique_violation
    expect(isRetryable({ code: '23503' })).toBe(false); // foreign_key_violation
    expect(isRetryable({ code: '22P02' })).toBe(false); // invalid_text_representation
    expect(isRetryable(new Error('plain error'))).toBe(false);
    expect(isRetryable(undefined)).toBe(false);
    expect(isRetryable(null)).toBe(false);
  });
});
