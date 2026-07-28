/**
 * Garage — the cars, and the door to everything else this build has.
 *
 * Not the §C4 Garage yet (no photos, no status chips, no archive section): this
 * session's app exists to exercise the sync contracts and land the S-4 queue.
 * What IS real: three fields to add a car ("Three fields. Everything else can
 * wait."), and a review entry that states its count plainly.
 */

import { useStatus } from '@powersync/react';
import { useQuery } from '@powersync/react';
import { Link, Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Text, View, StyleSheet } from 'react-native';

import { carLabel, insertCar, type CarRow } from '../src/data/cars';
import { newId } from '../src/data/ids';
import { OPEN_FLAG_COUNT_SQL } from '../src/data/flags';
import { useKoi } from '../src/sync/provider';
import {
  Button,
  Card,
  Empty,
  Field,
  Row,
  Screen,
  SectionLabel,
  Toast,
  type ToastState,
} from '../src/ui/components';
import { color, space, type } from '../src/ui/theme';
import { SELFTEST } from '../src/sync/config';

export default function GarageScreen(): React.JSX.Element {
  const {
    db,
    deviceId,
    syncEnabled,
    connectError,
    enableSync,
    disableSync,
    recoveryCodes,
    dismissRecoveryCodes,
  } = useKoi();
  const router = useRouter();
  const status = useStatus();
  const { data: cars = [] } = useQuery<CarRow>(`SELECT * FROM cars ORDER BY make, model`);
  const { data: counts = [] } = useQuery<{ n: number }>(OPEN_FLAG_COUNT_SQL);
  const openFlags = counts[0]?.n ?? 0;
  // ps_crud is PowerSync's own local upload queue — a real table, live like any
  // other query. It fills from the very first write regardless of connection
  // (that is what makes turning sync on later a single connect() call, D-052).
  const { data: pending = [] } = useQuery<{ n: number }>(`SELECT count(*) AS n FROM ps_crud`);
  const pendingCount = pending[0]?.n ?? 0;

  const [adding, setAdding] = useState(false);
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [fuelType, setFuelType] = useState('petrol');
  const [toast, setToast] = useState<ToastState | null>(null);
  const [syncBusy, setSyncBusy] = useState(false);

  // A car delete confirms on the car page but reports here, because that page is
  // gone the moment the car is. No Undo rides this toast: a car delete has none
  // (inv.30), and offering one would be a promise Koi cannot keep.
  const { deletedReadings } = useLocalSearchParams<{ deletedReadings?: string }>();
  useEffect(() => {
    if (deletedReadings === undefined) return;
    const n = Number(deletedReadings);
    setToast({
      message:
        Number.isFinite(n) && n > 0
          ? `Car deleted, with ${String(n)} ${n === 1 ? 'reading' : 'readings'}.`
          : 'Car deleted.',
    });
  }, [deletedReadings]);

  // Launching with EXPO_PUBLIC_KOI_SELFTEST=1 goes straight to the scenarios, so a
  // screenshot of a launched app is the evidence that the S-6 semantics hold here.
  if (SELFTEST) return <Redirect href="/selftest" />;

  const canSave = make.trim() !== '' && model.trim() !== '' && fuelType.trim() !== '';

  const save = async (): Promise<void> => {
    await insertCar(db, {
      id: newId(),
      make: make.trim(),
      model: model.trim(),
      fuelType: fuelType.trim(),
    });
    setMake('');
    setModel('');
    setFuelType('petrol');
    setAdding(false);
  };

  // Turning sync on/off is the ③ switch (D-052): no confirmation dialog either
  // way — enabling costs nothing undoable (existing records just start
  // reaching a server this household owns) and disabling only pauses future
  // uploads, it never un-syncs what already left.
  const turnOnSync = async (): Promise<void> => {
    setSyncBusy(true);
    try {
      await enableSync();
    } finally {
      setSyncBusy(false);
    }
  };

  const turnOffSync = async (): Promise<void> => {
    setSyncBusy(true);
    try {
      await disableSync();
      setToast({ message: 'Sync paused. Records already sent stay on the server.' });
    } finally {
      setSyncBusy(false);
    }
  };

  return (
    <View style={styles.root}>
      <Screen>
        <Card>
          <Row
            title={openFlags === 0 ? 'Nothing needs review' : 'Needs review'}
            meta={
              openFlags === 0
                ? 'Koi tells you here when a change needs a decision.'
                : `${openFlags} ${openFlags === 1 ? 'note' : 'notes'} waiting`
            }
            value={openFlags === 0 ? undefined : String(openFlags)}
            accent={openFlags === 0 ? color.hairline : color.attention}
            onPress={() => router.push('/review')}
          />
        </Card>

        <SectionLabel>Cars</SectionLabel>
        {cars.length === 0 && <Empty>Add your car to begin.</Empty>}
        {cars.map((car) => (
          <Card key={car.id}>
            <Row
              title={carLabel(car)}
              meta={`${car.make} ${car.model}${car.year === null ? '' : ` · ${String(car.year)}`}`}
              onPress={() => router.push(`/car/${car.id}`)}
              accent={color.domain.fuel}
            />
          </Card>
        ))}

        {adding ? (
          <Card>
            <Text style={type.title}>Add a car</Text>
            <Text style={type.soft}>Three fields. Everything else can wait.</Text>
            <Field label="Make" value={make} onChangeText={setMake} placeholder="VW" />
            <Field label="Model" value={model} onChangeText={setModel} placeholder="Golf GTI" />
            <Field label="Fuel" value={fuelType} onChangeText={setFuelType} placeholder="petrol" />
            <View style={styles.actions}>
              <Button label="Cancel" tone="quiet" onPress={() => setAdding(false)} />
              <Button label="Save" tone="accent" disabled={!canSave} onPress={() => void save()} />
            </View>
          </Card>
        ) : (
          <Button label="Add a car" onPress={() => setAdding(true)} />
        )}

        <SectionLabel>Sync</SectionLabel>
        <Card>
          {syncEnabled ? (
            <>
              <Text style={type.body}>
                This device syncs to your own server, so your other devices see the same records.
                It never leaves servers you run.
              </Text>
              <Text style={type.faint}>
                {connectError !== null
                  ? `Not connected: ${connectError}`
                  : status.connected
                    ? 'Syncing'
                    : 'Not connected'}
                {status.hasSynced === true ? ' · first sync done' : ''}
              </Text>
              {pendingCount > 0 && (
                <Text style={type.faint}>
                  {pendingCount} {pendingCount === 1 ? 'change' : 'changes'} waiting to reach the
                  server
                </Text>
              )}
              <Button
                label={syncBusy ? 'Working…' : 'Turn off sync'}
                tone="quiet"
                disabled={syncBusy}
                onPress={() => void turnOffSync()}
              />
            </>
          ) : (
            <>
              <Text style={type.body}>
                Your data never leaves this device. No account, cloud sync or analytics.
              </Text>
              {pendingCount > 0 && (
                <Text style={type.faint}>{pendingCount} records kept here so far.</Text>
              )}
              <Button
                label={syncBusy ? 'Working…' : 'Turn on sync'}
                tone="accent"
                disabled={syncBusy}
                onPress={() => void turnOnSync()}
              />
              {syncBusy && <ActivityIndicator />}
            </>
          )}
          <Text style={type.faint} selectable>
            {deviceId}
          </Text>
          {SELFTEST && (
            <Link href="/selftest" style={styles.link}>
              <Text style={[type.body, { color: color.accent }]}>Run the sync self-test</Text>
            </Link>
          )}
        </Card>

        {recoveryCodes !== null && (
          <Card>
            <Text style={type.title}>Save your recovery codes</Text>
            <Text style={type.soft}>
              If you lose access to every device with your passkey, one of these codes gets you
              back in. Each works once. Koi shows them only this one time.
            </Text>
            <Text style={[type.body, styles.codes]} selectable>
              {recoveryCodes.join('\n')}
            </Text>
            <Button label="I've saved these" tone="accent" onPress={dismissRecoveryCodes} />
          </Card>
        )}
      </Screen>
      <Toast state={toast} onDismiss={() => setToast(null)} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.paper },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: space.sm },
  codes: { fontFamily: 'Menlo', letterSpacing: 1 },
  link: { paddingVertical: space.sm },
});
