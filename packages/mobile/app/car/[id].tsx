/**
 * The car page — and where the S-6 client contract is actually exercised by a
 * human: add a reading, delete one and undo it from the toast, delete the car and
 * watch its readings go with it.
 *
 * Two things worth noticing:
 *
 *  - The current odometer is **derived**, never stored (S-3): the trail goes
 *    through `deriveCurrentOdometerKm` from @koi/domain on every render. There is
 *    no `current_odo` column to conflict over anywhere in the system.
 *  - A new reading is checked by the same pure function the server runs on upload
 *    (`checkOdometerReading`). A hard violation blocks and names the conflict
 *    (§B2 inv.9); it is the client half of "flag, never fix" — the server would
 *    accept the write and flag it, so refusing it here is what keeps the user's
 *    own device honest without silently repairing anything.
 */

import { checkOdometerReading, deriveCurrentOdometerKm } from '@koi/domain';
import { useQuery } from '@powersync/react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Text, View, StyleSheet } from 'react-native';

import { todayCivil } from '../../src/clock';
import { carLabel, deleteCarWithReadings, type CarRow } from '../../src/data/cars';
import { newId } from '../../src/data/ids';
import {
  deleteReading,
  insertReading,
  undoDeleteReading,
  type ReadingRow,
} from '../../src/data/readings';
import { useKoi } from '../../src/sync/provider';
import {
  Button,
  Card,
  ConfirmPanel,
  Empty,
  Field,
  KeyValue,
  Row,
  Screen,
  SectionLabel,
  Toast,
  type ToastState,
} from '../../src/ui/components';
import { color, space, type } from '../../src/ui/theme';

export default function CarScreen(): React.JSX.Element {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { db, deviceId } = useKoi();
  const router = useRouter();

  const { data: cars = [] } = useQuery<CarRow>(`SELECT * FROM cars WHERE id = ?`, [id]);
  const { data: readings = [] } = useQuery<ReadingRow>(
    `SELECT * FROM odometer_readings WHERE car_id = ? ORDER BY recorded_date DESC, reading_km DESC`,
    [id],
  );

  const [km, setKm] = useState('');
  const [date, setDate] = useState(todayCivil());
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [typed, setTyped] = useState('');
  const [toast, setToast] = useState<ToastState | null>(null);

  const trail = useMemo(
    () => readings.map((r) => ({ readingKm: r.reading_km, recordedDate: r.recorded_date })),
    [readings],
  );
  const current = deriveCurrentOdometerKm(trail);
  const car = cars[0];

  // A delete removes the row from this device (bucket-filter), so the toast
  // closure — not the database — is what an undo restores from (inv.31).
  const removeReading = async (row: ReadingRow): Promise<void> => {
    const captured = await deleteReading(db, row.id);
    if (captured === null) return;
    setToast({
      message: 'Reading deleted.',
      action: { label: 'Undo', onPress: () => void undoDeleteReading(db, captured) },
    });
  };

  const addReading = async (): Promise<void> => {
    const readingKm = Number(km);
    const violation = checkOdometerReading(trail, { readingKm, recordedDate: date });
    if (violation !== null) {
      setError(violation.message);
      return;
    }
    setError(null);
    await insertReading(db, {
      id: newId(),
      carId: id,
      readingKm,
      recordedDate: date,
      deviceId,
    });
    setKm('');
  };

  // The confirmation happens here but the feedback belongs to the garage: this
  // screen is gone the moment the car is, so a toast set here would never show.
  const removeCar = async (): Promise<void> => {
    const children = await deleteCarWithReadings(db, id);
    router.replace({ pathname: '/', params: { deletedReadings: String(children) } });
  };

  if (car === undefined) {
    return (
      <Screen>
        <Empty>This car is not on this device. It may have been deleted somewhere else.</Empty>
        <Button label="Back to the garage" onPress={() => router.replace('/')} />
      </Screen>
    );
  }

  return (
    <View style={styles.root}>
      <Screen>
        <Card>
          <Text style={type.display}>{carLabel(car)}</Text>
          <KeyValue label="Make and model" value={`${car.make} ${car.model}`} />
          <KeyValue label="Fuel" value={car.fuel_type} />
          <KeyValue
            label="Odometer now"
            value={current === null ? 'no readings' : `${current.toLocaleString()} km`}
          />
          <Text style={type.faint}>Derived from the trail, never stored (S-3).</Text>
        </Card>

        <SectionLabel>Add a reading</SectionLabel>
        <Card>
          <Field
            label="Kilometres"
            value={km}
            onChangeText={setKm}
            keyboardType="number-pad"
            placeholder="90000"
          />
          <Field label="Date" value={date} onChangeText={setDate} placeholder="2026-07-25" />
          {error !== null && <Text style={[type.soft, { color: color.critical }]}>{error}</Text>}
          <Button
            label="Save reading"
            tone="accent"
            disabled={km.trim() === ''}
            onPress={() => void addReading()}
          />
        </Card>

        <SectionLabel>Readings</SectionLabel>
        {readings.length === 0 && <Empty>No readings yet.</Empty>}
        {readings.map((reading) => (
          <Card key={reading.id}>
            <Row
              title={`${reading.reading_km.toLocaleString()} km`}
              meta={`${reading.recorded_date} · ${reading.source ?? 'manual'}`}
              accent={color.inkFaint}
            />
            <Button label="Delete" tone="critical" onPress={() => void removeReading(reading)} />
          </Card>
        ))}

        <SectionLabel>This car</SectionLabel>
        {confirming ? (
          <>
            <ConfirmPanel
              title="Delete this car?"
              body={`This deletes the car and its ${readings.length} ${
                readings.length === 1 ? 'reading' : 'readings'
              }. There is no undo. Type delete to confirm.`}
              confirmLabel="Delete"
              onConfirm={() => {
                if (typed.trim().toLowerCase() === 'delete') void removeCar();
              }}
              onCancel={() => {
                setConfirming(false);
                setTyped('');
              }}
            />
            <Card>
              <Field label="Type delete" value={typed} onChangeText={setTyped} placeholder="delete" />
            </Card>
          </>
        ) : (
          <Button label="Delete this car" tone="critical" onPress={() => setConfirming(true)} />
        )}
      </Screen>
      <Toast state={toast} onDismiss={() => setToast(null)} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.paper, paddingBottom: space.xs },
});
