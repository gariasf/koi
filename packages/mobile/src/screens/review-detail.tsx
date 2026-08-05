/**
 * One review item — the screen where a flag becomes a decision. Carried over intact
 * from Session 4 (D-047/D-051) and re-dressed in the control language; every rule
 * below was hard-won and none of them changed.
 *
 * What it shows: the server's own message (that text IS the evidence, so it is
 * rendered verbatim, never paraphrased), the values involved, and only the actions
 * this architecture can actually honour:
 *
 *  - a live record can have a displaced value written back, or be opened;
 *  - a DELETED record cannot be restored from here — a car never resurrects via PUT
 *    (inv.30) and only the deleting device's own undo resurrects a reading (D-040), so
 *    offering "restore" would be a promise Koi cannot keep. The honest action is to
 *    enter the values again as a new record;
 *  - a dead-lettered op has nothing to repair on the device: its payload lives on the
 *    server. Saying so is the whole job.
 *
 * Resolving is a latch, and it is undoable from the toast like every other
 * destructive-ish act (inv.31) — the inverse write re-opens the item. The toast is now
 * the app-level one, so that undo survives a navigation.
 *
 * The one change: numbers are formatted through the locale edge instead of
 * `toLocaleString()`, which dropped the separator on four-digit values.
 */

import { useQuery } from '@powersync/react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { nowIso } from '../clock';
import {
  reopenFlag,
  resolveFlag,
  restorableColumns,
  restoreDisplaced,
  type FlagRow,
} from '../data/flags';
import { insertReading } from '../data/readings';
import { newId } from '../data/ids';
import { namedPayloadEntries, reviewKind, unwrapPayload } from '../review/kinds';
import { flagSubject, type FlagWithRecord } from '../review/naming';
import { ONE_REVIEW_SQL } from '../review/queries';
import { useKoi } from '../sync/provider';
import { Button, Card, Empty, FactRow, Gutter, PageHeader, Root, SectionLabel } from '../ui/controls';
import { useFormat } from '../ui/format';
import { useKoiTheme } from '../ui/theme';
import { useToast } from '../ui/toast';

import type { KoiFormat } from '../ui/format';

type ReviewRow = FlagRow & FlagWithRecord;

const show = (value: unknown, f: KoiFormat): string => {
  if (value === null || value === undefined) return 'not set';
  if (typeof value === 'string') return value === '' ? 'empty' : value;
  if (typeof value === 'number') return f.integer(value);
  if (typeof value === 'boolean') return value ? 'yes' : 'no';
  return JSON.stringify(value);
};

export default function ReviewItemScreen(): React.JSX.Element {
  const { id } = useLocalSearchParams<{ id: string }>();
  const t = useKoiTheme();
  const f = useFormat();
  const router = useRouter();
  const toast = useToast();
  const { db, deviceId } = useKoi();
  const [reEntered, setReEntered] = useState(false);

  const { data: rows = [], isLoading } = useQuery<ReviewRow>(ONE_REVIEW_SQL, [id]);
  const flag = rows[0];

  if (flag === undefined) {
    return (
      <Root>
        <PageHeader back="Review notes" onBack={() => router.back()} title="Note" />
        <Gutter style={{ paddingTop: t.space.lg }}>
          <Empty>{isLoading ? 'Loading…' : 'This note is no longer here.'}</Empty>
        </Gutter>
      </Root>
    );
  }

  const kind = reviewKind(flag.kind);
  const subject = flagSubject(flag);
  const resolved = flag.resolved_at !== null;
  // column-conflict carries a bare scalar under column_name, not an object —
  // namedPayloadEntries is the one place that shape is resolved (kinds.ts), so this
  // and the restore write can never read the payload two different ways.
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
  // `car_make` comes through the join on car_id, and the bucket carries only live
  // cars — non-null here means the car is actually on this device right now.
  // `late-child`'s car is never live (that IS the flag): re-entering under it would
  // insert tombstone-born again (D-042's own insertLateChild path) and vanish a
  // second time, silently.
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
    toast.showUndo('Marked as reviewed.', () => reopenFlag(db, flag.id));
  };

  const restore = async (): Promise<void> => {
    const written = await restoreDisplaced(db, flag);
    if (!written) {
      toast.showError('There is no value here to put back.');
      return;
    }
    await resolveFlag(db, flag.id, nowIso());
    toast.show('Value put back.');
  };

  /**
   * Re-enter: a NEW record from the payload, with a new id. Not a restore, and it does
   * not pretend to be one — the original stays deleted.
   */
  const reEnter = async (): Promise<void> => {
    const source = [...displaced, ...incoming];
    const km = source.find((e) => e.column === 'reading_km')?.value;
    const date = source.find((e) => e.column === 'recorded_date')?.value;
    if (typeof km !== 'number' || typeof date !== 'string' || flag.car_id === null) {
      toast.showError('This note does not carry enough to enter again.');
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
    toast.show('Entered again as a new reading.');
  };

  return (
    <Root>
      <PageHeader back="Review notes" onBack={() => router.back()} title={kind.title} />
      <Gutter style={{ paddingTop: t.space.lg, gap: t.space.md }}>
        <Card>
          <Text style={t.type.title}>{kind.title}</Text>
          <Text style={t.type.soft}>
            {subject.name}
            {subject.carName !== null ? ` · ${subject.carName}` : ''}
          </Text>
          {subject.absent && (
            <Text style={t.type.faint}>This record is deleted, so it is not on this device.</Text>
          )}
        </Card>

        <Card>
          <Text style={t.type.body}>{kind.what}</Text>
          {kind.note !== undefined && <Text style={t.type.soft}>{kind.note}</Text>}
        </Card>

        <SectionLabel>What Koi recorded</SectionLabel>
        <Card>
          {/* Verbatim: the server wrote this sentence with the data in hand. */}
          <Text style={t.type.soft}>{flag.message}</Text>
          {flag.column_name !== null && <FactRow label="Field" value={flag.column_name} />}
          <FactRow label="Written by" value={flag.device_id ?? 'unknown device'} />
          {flag.created_at !== null && <FactRow label="When" value={flag.created_at} />}
          {flag.record_version !== null && (
            <FactRow label="Record version" value={f.integer(flag.record_version)} last />
          )}
        </Card>

        {displaced.length > 0 && (
          <>
            <SectionLabel>The value it replaced</SectionLabel>
            <Card>
              {displaced.map((e, i) => (
                <FactRow
                  key={e.column}
                  label={e.column}
                  value={show(e.value, f)}
                  last={i === displaced.length - 1}
                />
              ))}
            </Card>
          </>
        )}

        {incoming.length > 0 && (
          <>
            <SectionLabel>The value that arrived</SectionLabel>
            <Card>
              {incoming.map((e, i) => (
                <FactRow
                  key={e.column}
                  label={e.column}
                  value={show(e.value, f)}
                  last={i === incoming.length - 1}
                />
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
            <Text style={t.type.soft}>Marked as reviewed{`\n${flag.resolved_at ?? ''}`}</Text>
            <Button label="Open it again" onPress={() => void reopenFlag(db, flag.id)} />
          </Card>
        ) : (
          <View style={{ gap: t.space.sm }}>
            {canRestore && (
              <Button label="Put the other value back" onPress={() => void restore()} />
            )}
            {canOpen && flag.car_id !== null && (
              <Button
                label="Open the record"
                onPress={() => router.push(`/garage/car/${flag.car_id ?? ''}`)}
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
            {/* Stays on the page rather than popping: the item flips to its
                Reviewed state in place, which is what makes the toast's Undo mean
                something you can still see. */}
            <Button
              label={kind.actions.includes('keep-current') ? 'Keep what is here' : 'Mark reviewed'}
              variant="primary"
              onPress={() => void resolve()}
            />
          </View>
        )}
      </Gutter>
    </Root>
  );
}
