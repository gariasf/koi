import { describe, expect, it } from 'vitest';

import { planPatch, planPutOnExisting, valuesEqual } from '../src/sync/versioning.js';

const base = {
  current: { nickname: 'Golf', plate: null, make: 'VW' },
  columnVersions: {
    nickname: { v: 1, by: 'device-0' },
    plate: { v: 1, by: 'device-0' },
    make: { v: 1, by: 'device-0' },
  },
  recordVersion: 1,
};

describe('planPatch — the base_version per-column protocol (S-5/D-023)', () => {
  it('flags a same-column overwrite from another device', () => {
    // device-A already moved nickname to v2; device-B edits from base 1.
    const plan = planPatch({
      current: { ...base.current, nickname: 'Red Rocket' },
      columnVersions: { ...base.columnVersions, nickname: { v: 2, by: 'device-A' } },
      recordVersion: 2,
      incoming: { nickname: 'Blue Beast' },
      baseVersion: 1,
      deviceId: 'device-B',
    });
    expect(plan.noop).toBe(false);
    expect(plan.newVersion).toBe(3);
    expect(plan.conflicts).toHaveLength(1);
    expect(plan.conflicts[0]).toMatchObject({
      column: 'nickname',
      displacedValue: 'Red Rocket',
      incomingValue: 'Blue Beast',
      displacedWriterDevice: 'device-A',
      displacedAtVersion: 2,
    });
    expect(plan.columnVersions['nickname']).toEqual({ v: 3, by: 'device-B' });
  });

  it('merges disjoint-column concurrent edits with NO flag (the ② k3 distinction)', () => {
    // device-A moved nickname to v2; device-B edits plate from base 1.
    const plan = planPatch({
      current: { ...base.current, nickname: 'Red Rocket' },
      columnVersions: { ...base.columnVersions, nickname: { v: 2, by: 'device-A' } },
      recordVersion: 2,
      incoming: { plate: 'B-1234-XY' },
      baseVersion: 1,
      deviceId: 'device-B',
    });
    expect(plan.conflicts).toHaveLength(0);
    expect(plan.missingBase).toBe(false);
    expect(plan.newVersion).toBe(3);
  });

  it('a device\'s own sequential offline edits never self-conflict', () => {
    // device-A's first offline edit landed as v2; its second edit still
    // echoes base 1 (record_version never changes locally).
    const plan = planPatch({
      current: { ...base.current, nickname: 'First edit' },
      columnVersions: { ...base.columnVersions, nickname: { v: 2, by: 'device-A' } },
      recordVersion: 2,
      incoming: { nickname: 'Second edit' },
      baseVersion: 1,
      deviceId: 'device-A',
    });
    expect(plan.conflicts).toHaveLength(0);
    expect(plan.newVersion).toBe(3);
  });

  it('two devices writing the SAME value agree — no conflict', () => {
    const plan = planPatch({
      current: { ...base.current, nickname: 'Red Rocket' },
      columnVersions: { ...base.columnVersions, nickname: { v: 2, by: 'device-A' } },
      recordVersion: 2,
      incoming: { nickname: 'Red Rocket' },
      baseVersion: 1,
      deviceId: 'device-B',
    });
    expect(plan.noop).toBe(true);
  });

  it('identical replay is a noop (idempotent retry after commit)', () => {
    const plan = planPatch({
      ...base,
      incoming: { nickname: 'Golf' },
      baseVersion: 1,
      deviceId: 'device-A',
    });
    expect(plan.noop).toBe(true);
    expect(plan.newVersion).toBe(1);
  });

  it('a baseless change over ANOTHER device\'s data reports missingBase', () => {
    const plan = planPatch({
      ...base,
      incoming: { nickname: 'New name' },
      baseVersion: null,
      deviceId: 'device-B',
    });
    expect(plan.noop).toBe(false);
    expect(plan.missingBase).toBe(true);
    expect(plan.conflicts).toHaveLength(0);
  });

  it('the ordinary offline create-then-edit flow raises NO missing-base flag', () => {
    // Device A PUT a new row (all columns {v:1, by:device-A}), then PATCHes
    // it; the local row has no record_version yet, so the echo is null —
    // but every displaced column is A's own writing. No ambiguity, no flag.
    const plan = planPatch({
      current: { nickname: null, plate: null, make: 'VW' },
      columnVersions: {
        nickname: { v: 1, by: 'device-A' },
        plate: { v: 1, by: 'device-A' },
        make: { v: 1, by: 'device-A' },
      },
      recordVersion: 1,
      incoming: { nickname: 'Fresh car' },
      baseVersion: null,
      deviceId: 'device-A',
    });
    expect(plan.noop).toBe(false);
    expect(plan.missingBase).toBe(false);
    expect(plan.conflicts).toHaveLength(0);
  });

  it('a base from the future (backup restore) degrades to missing-base, never silent LWW', () => {
    // Server restored to v3; the client still echoes base 7. The echo is
    // uninterpretable — it must NOT disarm conflict detection silently.
    const plan = planPatch({
      current: { ...base.current, nickname: 'Post-restore' },
      columnVersions: { ...base.columnVersions, nickname: { v: 2, by: 'device-A' } },
      recordVersion: 3,
      incoming: { nickname: 'Stale-base edit' },
      baseVersion: 7,
      deviceId: 'device-B',
    });
    expect(plan.noop).toBe(false);
    expect(plan.missingBase).toBe(true);
    expect(plan.newVersion).toBe(4);
  });

  it('an unknown last-writer device (by: null) still conflicts — null never matches', () => {
    const plan = planPatch({
      current: { ...base.current, nickname: 'Server seeded' },
      columnVersions: { ...base.columnVersions, nickname: { v: 2, by: null } },
      recordVersion: 2,
      incoming: { nickname: 'Client edit' },
      baseVersion: 1,
      deviceId: 'device-B',
    });
    expect(plan.conflicts).toHaveLength(1);
  });

  it('a column with no version entry (pre-protocol row) never conflicts', () => {
    const plan = planPatch({
      current: { nickname: 'Golf' },
      columnVersions: {},
      recordVersion: 5,
      incoming: { nickname: 'New' },
      baseVersion: 1,
      deviceId: 'device-B',
    });
    expect(plan.conflicts).toHaveLength(0);
    expect(plan.newVersion).toBe(6);
    expect(plan.columnVersions['nickname']).toEqual({ v: 6, by: 'device-B' });
  });

  it('null and undefined compare equal (absent column == null)', () => {
    expect(valuesEqual(undefined, null)).toBe(true);
    expect(valuesEqual(null, 0)).toBe(false);
    expect(valuesEqual('a', 'a')).toBe(true);
  });
});

describe('planPutOnExisting', () => {
  it('asserts the incoming row and snapshots every displaced column', () => {
    const plan = planPutOnExisting({
      current: { nickname: 'Golf', plate: 'OLD-1', make: 'VW' },
      columnVersions: base.columnVersions,
      recordVersion: 3,
      incoming: { nickname: 'Golf', make: 'VW' }, // plate absent -> null
      writableColumns: ['nickname', 'plate', 'make'],
      deviceId: 'device-B',
    });
    expect(plan.noop).toBe(false);
    expect(plan.newVersion).toBe(4);
    expect(plan.changedColumns).toEqual(['plate']);
    expect(plan.displacedSnapshot).toEqual({ plate: 'OLD-1' });
  });

  it('is a noop when the row already matches (replayed insert)', () => {
    const plan = planPutOnExisting({
      current: { nickname: 'Golf', plate: null, make: 'VW' },
      columnVersions: base.columnVersions,
      recordVersion: 1,
      incoming: { nickname: 'Golf', make: 'VW' },
      writableColumns: ['nickname', 'plate', 'make'],
      deviceId: 'device-A',
    });
    expect(plan.noop).toBe(true);
  });
});
