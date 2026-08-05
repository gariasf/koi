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
 * A failure to connect (once sync IS on) is shown, not hidden — but **not as a badge
 * in the shell** (D-058, §16 #17 accepted). It is carried here as `connectError` and
 * rendered as a sentence on the Sync page, and as a toast at the moment an action
 * fails. The recorded consequence: a user whose sync has been broken for days finds
 * out on a visit to Settings. A dot on four roots would nag from everywhere about
 * something the car does not need from them, and the app keeps working regardless —
 * local-first, the queue drains later.
 *
 * **`everSynced`** is the discriminator the whole Settings sheet runs on: not "is
 * sync on" but *has this device ever synced*. Turning sync off is a pause — nothing
 * already sent is clawed back, the founding passkey outlives it, the account still
 * exists — so a privacy card keyed on the toggle would print a false promise to a
 * device that has an account. Latched once, never cleared, and it deliberately
 * survives an erase.
 */

import { PowerSyncContext } from '@powersync/react';
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { Text, View, StyleSheet } from 'react-native';

import { generateRecoveryCodes, ensureSignedIn } from '../auth/flow';
import { getSessionCookie } from '../auth/client';
import { hasEverSynced, latchEverSynced } from '../ui/settings-store';
import { buildTheme, useOsScheme } from '../ui/theme';
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
  /** Has this device ever synced? Latched once — see the module doc. */
  readonly everSynced: boolean;
  readonly connectError: string | null;
  readonly enableSync: () => Promise<void>;
  readonly disableSync: () => Promise<void>;
  /**
   * Wipes every record on this device. **`clearLocal: false` is load-bearing:** it
   * preserves the local-only `app_meta`, and with it the `has_ever_synced` latch —
   * a wiped device that has an account must not go back to claiming it never had
   * one, which is the exact §H1 violation the three-state privacy card exists to
   * prevent. It also keeps this device's id, so it stays the same device to the
   * attribution ledger.
   */
  readonly eraseThisDevice: () => Promise<void>;
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
  const [everSynced, setEverSynced] = useState(false);
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
      // Rethrown so the caller can say so in a sentence at the moment it happened.
      // Sync stays off: a device that could not sign in has no account here.
      setConnectError(e instanceof Error ? e.message : String(e));
      throw e;
    }
    await setSyncEnabled(database as unknown as KoiDb, true);
    setSyncEnabledState(true);
    // Latched at the point an account exists on this device, not at the point a
    // connection succeeds: the passkey outlives a failed connect, so the honest
    // sentences on the privacy card have to change from here on either way.
    await latchEverSynced(database as unknown as KoiDb);
    setEverSynced(true);
    try {
      await connectKoi(database, connector(deviceId));
      setConnectError(null);
    } catch (e) {
      setConnectError(e instanceof Error ? e.message : String(e));
      throw e;
    }
  }, [database, deviceId, connector]);

  const disableSync = useCallback(async (): Promise<void> => {
    if (database === null) return;
    await setSyncEnabled(database as unknown as KoiDb, false);
    await database.disconnect();
    setSyncEnabledState(false);
    setConnectError(null);
  }, [database]);

  const eraseThisDevice = useCallback(async (): Promise<void> => {
    if (database === null) return;
    // Sync off FIRST, and the dialog says so: with sync on, a local wipe
    // re-bootstraps from the checkpoint and the records come straight back
    // (S-7 erase-everywhere is explicitly not built). Order matters more than
    // tidiness here — it is the difference between an erase and a flicker.
    if (syncEnabled) await disableSync();
    await database.disconnectAndClear({ clearLocal: false });
  }, [database, syncEnabled, disableSync]);

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
        const enrolled = await hasEverSynced(db as unknown as KoiDb);

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
        setEverSynced(enrolled);
      } catch (e) {
        if (!cancelled) setFatal(e instanceof Error ? e.message : String(e));
      }
    })();

    return () => {
      cancelled = true;
      void db?.close();
    };
  }, []);

  // These two render BEFORE the theme provider exists (it needs the database the
  // provider is still opening), so they read the OS scheme directly. A dark phone
  // must not flash a paper-white screen on launch.
  if (fatal !== null) {
    return <Boot title="Koi could not open its database" detail={fatal} />;
  }

  if (database === null || deviceId === null) {
    return <Boot detail="Opening…" />;
  }

  const sync: KoiSync = {
    db: database as unknown as KoiDb,
    powersync: database,
    deviceId,
    apiUrl: API_URL,
    syncEnabled,
    everSynced,
    connectError,
    enableSync,
    disableSync,
    eraseThisDevice,
    recoveryCodes,
    dismissRecoveryCodes: () => setRecoveryCodes(null),
  };

  return (
    <KoiSyncContext.Provider value={sync}>
      <PowerSyncContext.Provider value={database}>{children}</PowerSyncContext.Provider>
    </KoiSyncContext.Provider>
  );
}

function Boot({ title, detail }: { title?: string; detail: string }): React.JSX.Element {
  const t = buildTheme(useOsScheme(), {
    appearance: 'system',
    setAppearance: () => undefined,
    reduceMotion: true,
    fontScale: 1,
  });
  return (
    <View style={[styles.centre, { backgroundColor: t.c.paper }]}>
      {title !== undefined && <Text style={t.type.title}>{title}</Text>}
      <Text style={[t.type.soft, styles.detail]}>{detail}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  centre: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 8,
  },
  detail: { textAlign: 'center' },
});
