/**
 * Opens the database, learns this device's id, and — only if sync is already
 * turned on — connects the connector. Once, for the whole app.
 *
 * Order matters: the device id has to exist before the connector is built,
 * because the id is the attribution key every S-6 same-device rule reads. The
 * screens render only after that, so no write can leave with a placeholder
 * identity.
 *
 * **Local-only is the default and makes no network call at all** (D-006/D-052):
 * `isSyncEnabled` is a local read, and when it is false this component never
 * constructs a connector, never mints a token, never reaches `apiUrl`. `init()`
 * still applies the full synced schema either way — that is what makes turning
 * sync on later just one `connect()` call: every write already sits in the
 * local upload queue (`mode.ts`), waiting.
 *
 * **Turning sync on now means signing in** (Build Session 6): there is no
 * separate auth step before the toggle — `enableSync` calls `ensureSignedIn`
 * (auth/flow.ts) first, which registers the founding passkey or signs in
 * with an existing one, and only connects once that succeeds. A relaunch
 * with sync already on reuses whatever session `@better-auth/expo` already
 * persisted in SecureStore — no re-prompt unless it actually expired.
 *
 * A failure to connect (once sync IS on) is shown, not hidden: the app keeps
 * working (local-first; the database is fully usable offline and the queue
 * drains later), and the banner says what is wrong.
 */

import { PowerSyncContext } from '@powersync/react';
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { Text, View, StyleSheet } from 'react-native';

import { generateRecoveryCodes, ensureSignedIn } from '../auth/flow';
import { getSessionCookie } from '../auth/client';
import { color, space, type } from '../ui/theme';
import { API_URL, POWERSYNC_URL } from './config';
import { KoiConnector } from './connector';
import { getOrCreateDeviceId } from './device';
import { isSyncEnabled, setSyncEnabled } from './mode';
import { connectKoi, createKoiDatabase } from './powersync';

import type { KoiDb } from '../data/db';
import type { CommonPowerSyncDatabase } from '@powersync/common';

interface KoiSync {
  readonly db: KoiDb;
  readonly powersync: CommonPowerSyncDatabase;
  readonly deviceId: string;
  readonly apiUrl: string;
  readonly syncEnabled: boolean;
  readonly connectError: string | null;
  readonly enableSync: () => Promise<void>;
  readonly disableSync: () => Promise<void>;
  /** Set once, right after a fresh passkey registration; cleared on dismiss. */
  readonly recoveryCodes: readonly string[] | null;
  readonly dismissRecoveryCodes: () => void;
}

const KoiSyncContext = createContext<KoiSync | null>(null);

export function useKoi(): KoiSync {
  const value = useContext(KoiSyncContext);
  if (value === null) throw new Error('useKoi outside KoiProvider');
  return value;
}

export function KoiProvider({ children }: { children: React.ReactNode }): React.JSX.Element {
  const [database, setDatabase] = useState<CommonPowerSyncDatabase | null>(null);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [syncEnabled, setSyncEnabledState] = useState(false);
  const [connectError, setConnectError] = useState<string | null>(null);
  const [fatal, setFatal] = useState<string | null>(null);
  const [recoveryCodes, setRecoveryCodes] = useState<readonly string[] | null>(null);

  const connector = useCallback(
    (id: string) =>
      new KoiConnector({
        apiUrl: API_URL,
        powerSyncUrl: POWERSYNC_URL,
        deviceId: id,
        getSessionCookie,
      }),
    [],
  );

  const enableSync = useCallback(async (): Promise<void> => {
    if (database === null || deviceId === null) return;
    try {
      const { registered } = await ensureSignedIn();
      if (registered) {
        // Best-effort: a failure here must not block sync itself — the codes
        // can be regenerated later (Settings, when that surface exists).
        try {
          setRecoveryCodes(await generateRecoveryCodes());
        } catch {
          setRecoveryCodes(null);
        }
      }
    } catch (e) {
      setConnectError(e instanceof Error ? e.message : String(e));
      return;
    }
    await setSyncEnabled(database as unknown as KoiDb, true);
    setSyncEnabledState(true);
    try {
      await connectKoi(database, connector(deviceId));
      setConnectError(null);
    } catch (e) {
      setConnectError(e instanceof Error ? e.message : String(e));
    }
  }, [database, deviceId, connector]);

  const disableSync = useCallback(async (): Promise<void> => {
    if (database === null) return;
    await setSyncEnabled(database as unknown as KoiDb, false);
    await database.disconnect();
    setSyncEnabledState(false);
    setConnectError(null);
  }, [database]);

  useEffect(() => {
    let db: CommonPowerSyncDatabase | null = null;
    let cancelled = false;

    void (async () => {
      try {
        db = createKoiDatabase();
        await db.init();
        const id = await getOrCreateDeviceId(db as unknown as KoiDb);
        // The local read that decides everything below: no account, no
        // network reachability check, no implicit opt-in — only what THIS
        // device already agreed to (default false).
        const alreadyOn = await isSyncEnabled(db as unknown as KoiDb);

        if (alreadyOn) {
          try {
            await connectKoi(
              db,
              new KoiConnector({
                apiUrl: API_URL,
                powerSyncUrl: POWERSYNC_URL,
                deviceId: id,
                getSessionCookie,
              }),
            );
          } catch (e) {
            if (!cancelled) setConnectError(e instanceof Error ? e.message : String(e));
          }
        }

        if (cancelled) return;
        setDatabase(db);
        setDeviceId(id);
        setSyncEnabledState(alreadyOn);
      } catch (e) {
        if (!cancelled) setFatal(e instanceof Error ? e.message : String(e));
      }
    })();

    return () => {
      cancelled = true;
      void db?.close();
    };
  }, []);

  if (fatal !== null) {
    return (
      <View style={styles.centre}>
        <Text style={type.title}>Koi could not open its database</Text>
        <Text style={[type.soft, styles.detail]}>{fatal}</Text>
      </View>
    );
  }

  if (database === null || deviceId === null) {
    return (
      <View style={styles.centre}>
        <Text style={type.soft}>Opening…</Text>
      </View>
    );
  }

  const sync: KoiSync = {
    db: database as unknown as KoiDb,
    powersync: database,
    deviceId,
    apiUrl: API_URL,
    syncEnabled,
    connectError,
    enableSync,
    disableSync,
    recoveryCodes,
    dismissRecoveryCodes: () => setRecoveryCodes(null),
  };

  return (
    <KoiSyncContext.Provider value={sync}>
      <PowerSyncContext.Provider value={database}>
        {syncEnabled && connectError !== null && (
          <View style={styles.banner}>
            <Text style={type.faint}>
              Not syncing: {connectError}. Your records are safe on this device.
            </Text>
          </View>
        )}
        {children}
      </PowerSyncContext.Provider>
    </KoiSyncContext.Provider>
  );
}

const styles = StyleSheet.create({
  centre: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: color.paper,
    padding: space.xl,
    gap: space.sm,
  },
  detail: { textAlign: 'center' },
  banner: {
    backgroundColor: '#F6EFE3',
    paddingHorizontal: space.lg,
    paddingVertical: space.sm,
  },
});
