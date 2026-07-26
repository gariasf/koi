/**
 * Record ids: UUIDv7, minted at the edge.
 *
 * @koi/domain deliberately cannot do this — it is dependency-free and banned
 * from clocks and crypto (that is what keeps V8 == JSC == Hermes byte-identical),
 * so it only *validates* ids (`isUuidV7`) and orders them (`compareIds`). The
 * shell mints them, exactly as D-025 specified.
 *
 * v7 rather than v4 because the leading 48 bits are the millisecond timestamp:
 * ids sort by creation time, which the merge/dedup ordering relies on.
 */

import { v7 as uuidv7 } from 'uuid';

export const newId = (): string => uuidv7();
