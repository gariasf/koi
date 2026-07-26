/**
 * Opens the database, learns this device's id, and connects the connector — once,
 * for the whole app.
 *
 * Order matters: the device id has to exist before the connector is built,
 * because the id is the attribution key every S-6 same-device rule reads. The
 * screens render only after that, so no write can leave with a placeholder
 * identity.
 *
 * A failure to connect is shown, not hidden: the app keeps working (local-first;
 * the database is fully usable offline and the queue drains later), and the
 * banner says what is wrong.
 */

import { PowerSyncContext } from '@powersync/react';
import { createContext, useContext, useEffect, useState } from 'react';
import { Text, View, StyleSheet } from 'react-native';

import { color, space, type } from '../ui/theme';
import { API_URL } from './config';
import { KoiConnector } from './connector';
import { getOrCreateDeviceId } from './device';
import { connectKoi, createKoiDatabase } from './powersync';

import type { KoiDb } from '../data/db';
import type { CommonPowerSyncDatabase } from '@powersync/common';

interface KoiSync {
  readonly db: KoiDb;
  readonly powersync: CommonPowerSyncDatabase;
  readonly deviceId: string;
  readonly apiUrl: string;
  readonly connectError: string | null;
}

const KoiSyncContext = createContext<KoiSync | null>(null);

export function useKoi(): KoiSync {
  const value = useContext(KoiSyncContext);
  if (value === null) throw new Error('useKoi outside KoiProvider');
  return value;
}

export function KoiProvider({ children }: { children: React.ReactNode }): React.JSX.Element {
  const [sync, setSync] = useState<KoiSync | null>(null);
  const [fatal, setFatal] = useState<string | null>(null);

  useEffect(() => {
    let database: CommonPowerSyncDatabase | null = null;
    let cancelled = false;

    void (async () => {
      try {
        database = createKoiDatabase();
        await database.init();
        const deviceId = await getOrCreateDeviceId(database as unknown as KoiDb);
        let connectError: string | null = null;
        try {
          await connectKoi(database, new KoiConnector({ apiUrl: API_URL, deviceId }));
        } catch (e) {
          connectError = e instanceof Error ? e.message : String(e);
        }
        if (cancelled) return;
        setSync({
          db: database as unknown as KoiDb,
          powersync: database,
          deviceId,
          apiUrl: API_URL,
          connectError,
        });
      } catch (e) {
        if (!cancelled) setFatal(e instanceof Error ? e.message : String(e));
      }
    })();

    return () => {
      cancelled = true;
      void database?.close();
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

  if (sync === null) {
    return (
      <View style={styles.centre}>
        <Text style={type.soft}>Opening…</Text>
      </View>
    );
  }

  return (
    <KoiSyncContext.Provider value={sync}>
      <PowerSyncContext.Provider value={sync.powersync}>
        {sync.connectError !== null && (
          <View style={styles.banner}>
            <Text style={type.faint}>
              Not syncing: {sync.connectError}. Your records are safe on this device.
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
