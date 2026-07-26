/**
 * The shape of a PowerSync database, as the data layer needs it — nothing more.
 *
 * Declared structurally instead of importing `AbstractPowerSyncDatabase` so the
 * write functions in this folder stay free of any SDK build: the app hands them
 * `@powersync/react-native` (op-sqlite on device) and the integration tier hands
 * them `@powersync/node` (better-sqlite3 on CI) — the SAME functions either way,
 * which is what makes the CI proof a proof about the app's own code.
 */

export interface KoiTx {
  execute(sql: string, params?: unknown[]): Promise<unknown>;
  getAll<T>(sql: string, params?: unknown[]): Promise<T[]>;
}

export interface KoiDb extends KoiTx {
  /**
   * One client transaction = one upload batch = one server transaction = one
   * checkpoint. Everything that must be observed together by peers (the car
   * cascade, D-041) goes inside a single call.
   */
  writeTransaction<T>(fn: (tx: KoiTx) => Promise<T>): Promise<T>;
}
