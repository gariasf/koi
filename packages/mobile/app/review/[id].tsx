/**
 * One review item — the screen where a flag becomes a decision.
 *
 * What it shows: the server's own message (that text IS the evidence, so it is
 * rendered verbatim, never paraphrased), the values involved, and only the actions
 * this architecture can actually honour:
 *
 *  - a live record can have a displaced value written back, or be opened;
 *  - a DELETED record cannot be restored from here — a car never resurrects via
 *    PUT (inv.30) and only the deleting device's own undo resurrects a reading
 *    (D-040), so offering "restore" would be a promise Koi cannot keep. The honest
 *    action is to enter the values again as a new record;
 *  - a dead-lettered op has nothing to repair on the device: its payload lives on
 *    the server. Saying so is the whole job.
 *
 * Resolving is a latch, and it is undoable from the toast like every other
 * destructive-ish act (inv.31) — the inverse write re-opens the item.
 */

import { useQuery } from '@powersync/react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Text, View, StyleSheet } from 'react-native';

import { nowIso } from '../../src/clock';
import {
  reopenFlag,
  resolveFlag,
  restorableColumns,
  restoreDisplaced,
  type FlagRow,
} from '../../src/data/flags';
import { insertReading } from '../../src/data/readings';
import { newId } from '../../src/data/ids';
import { namedPayloadEntries, reviewKind, unwrapPayload } from '../../src/review/kinds';
import { flagSubject, type FlagWithRecord } from '../../src/review/naming';
import { ONE_REVIEW_SQL } from '../../src/review/queries';
import { useKoi } from '../../src/sync/provider';
import {
  Button,
  Card,
  Empty,
  KeyValue,
  Screen,
  SectionLabel,
  Toast,
  type ToastState,
} from '../../src/ui/components';
import { color, space, type } from '../../src/ui/theme';

type ReviewRow = FlagRow & FlagWithRecord;

const show = (value: unknown): string => {
  if (value === null || value === undefined) return 'not set';
  if (typeof value === 'string') return value === '' ? 'empty' : value;
  if (typeof value === 'number') return value.toLocaleString();
  if (typeof value === 'boolean') return value ? 'yes' : 'no';
  return JSON.stringify(value);
};

export default function ReviewItemScreen(): React.JSX.Element {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { db, deviceId } = useKoi();
  const router = useRouter();
  const [toast, setToast] = useState<ToastState | null>(null);
  const [reEntered, setReEntered] = useState(false);

  const { data: rows = [], isLoading } = useQuery<ReviewRow>(ONE_REVIEW_SQL, [id]);
  const flag = rows[0];

  if (flag === undefined) {
    return (
      <Screen>
        <Empty>{isLoading ? 'Loading…' : 'This note is no longer here.'}</Empty>
      </Screen>
    );
  }

  const kind = reviewKind(flag.kind);
  const subject = flagSubject(flag);
  const resolved = flag.resolved_at !== null;
  // column-conflict carries a bare scalar under column_name, not an object —
  // namedPayloadEntries is the one place that shape is resolved (kinds.ts), so
  // this and the restore write can never read the payload two different ways.
  const displaced = namedPayloadEntries(
    flag.kind,
    flag.column_name,
    unwrapPayload(flag.displaced_value),
  );
  const incoming = namedPayloadEntries(
    flag.kind,
    flag.column_name,
    unwrapPayload(flag.incoming_value),
  );
  const restorable = restorableColumns(flag);

  // Presence is discovered, never assumed from the kind: bucket-filter means a
  // deleted record simply is not here.
  const present = !subject.absent;
  const canRestore = present && restorable !== null && kind.actions.includes('restore-displaced');
  const canOpen = present && kind.actions.includes('open-record');
  // `car_make` comes through the join on car_id, and the bucket carries only
  // live cars — non-null here means the car is actually on this device right
  // now. `late-child`'s car is never live (that IS the flag): re-entering under
  // it would insert tombstone-born again (D-042's own insertLateChild path) and
  // vanish a second time, silently. Rather than offer a one-tap action that
  // quietly does nothing, this screen says so and stops there — a car PICKER for
  // "enter it under a different car" is app-surface work (BOARD bucket D), not
  // built here, so promising it now would be exactly the honesty violation D-047
  // exists to prevent.
  const targetCarIsLive = flag.car_make !== null;
  const canReEnter =
    !present &&
    kind.actions.includes('re-enter') &&
    flag.record_table === 'odometer_readings' &&
    flag.car_id !== null &&
    targetCarIsLive;
  const reEnterBlockedByDeletedCar =
    !present &&
    kind.actions.includes('re-enter') &&
    flag.record_table === 'odometer_readings' &&
    flag.car_id !== null &&
    !targetCarIsLive;

  const resolve = async (): Promise<void> => {
    await resolveFlag(db, flag.id, nowIso());
    setToast({
      message: 'Marked as reviewed.',
      action: { label: 'Undo', onPress: () => void reopenFlag(db, flag.id) },
    });
  };

  const restore = async (): Promise<void> => {
    const written = await restoreDisplaced(db, flag);
    if (!written) {
      setToast({ message: 'There is no value here to put back.', tone: 'error' });
      return;
    }
    await resolveFlag(db, flag.id, nowIso());
    setToast({ message: 'Value put back.' });
  };

  /**
   * Re-enter: a NEW record from the payload, with a new id. Not a restore, and it
   * does not pretend to be one — the original stays deleted.
   */
  const reEnter = async (): Promise<void> => {
    const source = [...displaced, ...incoming];
    const km = source.find((e) => e.column === 'reading_km')?.value;
    const date = source.find((e) => e.column === 'recorded_date')?.value;
    if (typeof km !== 'number' || typeof date !== 'string' || flag.car_id === null) {
      setToast({ message: 'This note does not carry enough to enter again.', tone: 'error' });
      return;
    }
    await insertReading(db, {
      id: newId(),
      carId: flag.car_id,
      readingKm: km,
      recordedDate: date,
      deviceId,
    });
    setReEntered(true);
    setToast({ message: 'Entered again as a new reading.' });
  };

  return (
    <View style={styles.root}>
      <Screen>
        <Card>
          <Text style={type.title}>{kind.title}</Text>
          <Text style={type.soft}>
            {subject.name}
            {subject.carName !== null ? ` · ${subject.carName}` : ''}
          </Text>
          {subject.absent && (
            <Text style={type.faint}>This record is deleted, so it is not on this device.</Text>
          )}
        </Card>

        <Card>
          <Text style={type.body}>{kind.what}</Text>
          {kind.note !== undefined && <Text style={type.soft}>{kind.note}</Text>}
        </Card>

        <SectionLabel>What Koi recorded</SectionLabel>
        <Card>
          {/* Verbatim: the server wrote this sentence with the data in hand. */}
          <Text style={type.soft}>{flag.message}</Text>
          {flag.column_name !== null && <KeyValue label="Field" value={flag.column_name} />}
          <KeyValue label="Written by" value={flag.device_id ?? 'unknown device'} />
          {flag.created_at !== null && <KeyValue label="When" value={flag.created_at} />}
          {flag.record_version !== null && (
            <KeyValue label="Record version" value={String(flag.record_version)} />
          )}
        </Card>

        {displaced.length > 0 && (
          <>
            <SectionLabel>The value it replaced</SectionLabel>
            <Card>
              {displaced.map((e) => (
                <KeyValue key={e.column} label={e.column} value={show(e.value)} />
              ))}
            </Card>
          </>
        )}

        {incoming.length > 0 && (
          <>
            <SectionLabel>The value that arrived</SectionLabel>
            <Card>
              {incoming.map((e) => (
                <KeyValue key={e.column} label={e.column} value={show(e.value)} />
              ))}
            </Card>
          </>
        )}

        {displaced.length === 0 && incoming.length === 0 && (
          <Empty>
            This note carries no values of its own — the change itself is kept on the server.
          </Empty>
        )}

        <SectionLabel>{resolved ? 'Reviewed' : 'What do you want to do?'}</SectionLabel>
        {resolved ? (
          <Card>
            <Text style={type.soft}>Marked as reviewed{`\n${flag.resolved_at ?? ''}`}</Text>
            <Button label="Open it again" onPress={() => void reopenFlag(db, flag.id)} />
          </Card>
        ) : (
          <>
            {canRestore && (
              <Button label="Put the other value back" onPress={() => void restore()} />
            )}
            {canOpen && flag.car_id !== null && (
              <Button
                label="Open the record"
                onPress={() => router.push(`/car/${flag.car_id ?? ''}`)}
              />
            )}
            {canReEnter && (
              <Button
                label="Enter it again as a new reading"
                disabled={reEntered}
                onPress={() => void reEnter()}
              />
            )}
            {reEnterBlockedByDeletedCar && (
              <Empty>
                The car this reading belonged to is deleted too, so Koi cannot enter it again here.
                Add it under one of your other cars from Capture once you know which one.
              </Empty>
            )}
            <Button
              label={kind.actions.includes('keep-current') ? 'Keep what is here' : 'Mark reviewed'}
              tone="accent"
              onPress={() => void resolve()}
            />
          </>
        )}
      </Screen>
      <Toast state={toast} onDismiss={() => setToast(null)} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.paper, paddingBottom: space.xs },
});
