/**
 * The car page (sheet 04 §02) — and the fix for a shipped-and-fixed defect that had
 * come back.
 *
 * This page used to render **every** reading with an inline add form: a second copy
 * of the ledger, which is exactly what Tester R found in the old app and exactly what
 * the 2.0 one-ledger rule fixed. It renders **three** recent rows and a link to
 * History. Not five, not "a few", not scrollable — article 1 with a number on it.
 *
 * Deliberately **not** on this page: a readings list, an inline add-reading form, and
 * a delete-car button. The first two are the defect; the third belongs in the car
 * form's foot beside Archive, because destructive lifecycle actions belong together
 * and behind an edit intent.
 *
 * `…›` versus `›` is load-bearing: the ellipsis opens a *sheet*, the bare chevron
 * *pushes* a page. Without the distinction a row that opens a task is
 * indistinguishable from one that goes somewhere, and the user cannot predict whether
 * Back or Cancel is coming.
 *
 * The odometer has **one surface and two doors**: this card's `…›` opens the same
 * sheet Capture → Odometer opens, prefilled with this car. And the value itself is
 * derived from the trail on every render (S-3) — there is no `current_odo` column to
 * conflict over anywhere in the system.
 *
 * Two designed groups are absent because their data is: `PLAN` and `OWNERSHIP` never
 * both appear, and with no ownership kind, plan, price or cap in the schema, neither
 * one can appear at all. `CARE` is absent for the same reason — reminders and the
 * vault are their own tables.
 */

import { deriveCurrentOdometerKm } from '@koi/domain';
import { useQuery } from '@powersync/react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, Text, View } from 'react-native';

import { carTitle, type CarRow } from '../data/cars';
import { deleteReading, undoDeleteReading, type ReadingRow } from '../data/readings';
import { useKoi } from '../sync/provider';
import {
  Button,
  Empty,
  Gutter,
  PageHeader,
  PhotoPlaceholder,
  Root,
  Row,
  SectionLabel,
} from '../ui/controls';
import { useFormat } from '../ui/format';
import { Well } from '../ui/icons';
import { SwipeRow } from '../ui/swipe';
import { useKoiTheme } from '../ui/theme';
import { useToast } from '../ui/toast';

const RECENT = 3;

export default function CarScreen(): React.JSX.Element {
  const { id } = useLocalSearchParams<{ id: string }>();
  const t = useKoiTheme();
  const f = useFormat();
  const router = useRouter();
  const toast = useToast();
  const { db } = useKoi();

  const { data: cars = [] } = useQuery<CarRow>(`SELECT * FROM cars WHERE id = ?`, [id]);
  const { data: readings = [] } = useQuery<ReadingRow>(
    `SELECT * FROM odometer_readings WHERE car_id = ? ORDER BY recorded_date DESC, reading_km DESC`,
    [id],
  );

  const trail = useMemo(
    () => readings.map((r) => ({ readingKm: r.reading_km, recordedDate: r.recorded_date })),
    [readings],
  );
  const current = deriveCurrentOdometerKm(trail);
  const newest = readings[0];
  const car = cars[0];

  // A delete removes the row from this device (bucket-filter), so the closure the
  // toast holds — not the database — is what an undo restores from (inv.31). The
  // closure now lives in the app-level queue, so a second delete inside six seconds
  // no longer makes the first permanent.
  const removeReading = async (row: ReadingRow): Promise<void> => {
    const captured = await deleteReading(db, row.id);
    if (captured === null) return;
    toast.showUndo('Reading deleted.', () => undoDeleteReading(db, captured));
  };

  if (car === undefined) {
    return (
      <Root>
        <Gutter style={{ paddingTop: 76, gap: t.space.lg, alignItems: 'center' }}>
          <Text style={[t.type.body, { textAlign: 'center' }]}>
            This car is not on this device. It may have been deleted somewhere else.
          </Text>
          <Button label="Back to Garage" onPress={() => router.replace('/garage')} />
        </Gutter>
      </Root>
    );
  }

  const identity = [`${car.make} ${car.model}`, car.year === null ? null : String(car.year), car.fuel_type]
    .filter((part): part is string => part !== null && part !== '')
    .join(' · ');
  const specs =
    car.tank_capacity_l === null
      ? 'Tank not on file'
      : `${f.integer(car.tank_capacity_l)} L tank`;

  return (
    <Root>
      <PageHeader
        back="Garage"
        onBack={() => router.back()}
        title={carTitle(car)}
        action={
          <Button
            label="Edit"
            variant="ghost"
            compact
            onPress={() => router.push(`/car-form?id=${car.id}`)}
          />
        }
      />
      <PhotoPlaceholder height={150} />

      <Gutter style={{ paddingTop: t.space.md, gap: 4 }}>
        {car.plate !== null && car.plate !== '' && (
          <View style={{ alignSelf: 'flex-start' }}>
            <View
              style={{
                borderWidth: 1,
                borderColor: t.c.hairline,
                borderRadius: 6,
                paddingHorizontal: 12,
                paddingVertical: 4,
                backgroundColor: t.c.card,
              }}
            >
              <Text style={[t.type.data, { fontSize: 12.5, letterSpacing: 0.6 }]}>{car.plate}</Text>
            </View>
          </View>
        )}
        <Text style={t.type.body}>{identity}</Text>
        <Text style={[t.type.dataSoft, car.tank_capacity_l === null && { color: t.c.inkFaint }]}>
          {specs}
        </Text>
      </Gutter>

      <Gutter style={{ paddingTop: t.space.xl, gap: 4 }}>
        <SectionLabel>Odometer</SectionLabel>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Add an odometer reading"
          onPress={() => router.push(`/capture/odometer?car=${car.id}`)}
          style={({ pressed }) => [
            { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 44 },
            pressed && { opacity: 0.6 },
          ]}
        >
          {current === null ? (
            <Text style={[t.type.body, { flex: 1 }]}>No readings yet.</Text>
          ) : (
            <Text style={[t.type.data, { fontSize: 27, flex: 1 }]}>{f.km(current)}</Text>
          )}
          <Text style={t.type.link}>…›</Text>
        </Pressable>
        <Text style={t.type.soft}>
          {newest === undefined
            ? 'Koi will measure from your first reading.'
            : `Read ${f.dayMonthLong(newest.recorded_date)} · derived from your trail`}
        </Text>
      </Gutter>

      <Gutter style={{ paddingTop: t.space.xl, gap: t.space.xs }}>
        <SectionLabel>Recent</SectionLabel>
        {readings.length === 0 && <Empty>No readings yet.</Empty>}
        {readings.slice(0, RECENT).map((reading) => (
          <SwipeRow key={reading.id} onDelete={() => void removeReading(reading)}>
            <Row
              well={<Well kind="odometer" size={34} />}
              title={f.km(reading.reading_km)}
              titleMono
              meta={reading.source ?? 'manual'}
              date={f.dayMonth(reading.recorded_date)}
              onPress={() => router.push(`/capture/odometer?reading=${reading.id}`)}
            />
          </SwipeRow>
        ))}
        {readings.length > RECENT && (
          <View style={{ alignItems: 'center', paddingTop: t.space.sm }}>
            <Button
              label="Full history ›"
              variant="ghost"
              pill
              compact
              onPress={() => router.push('/history')}
            />
          </View>
        )}
      </Gutter>
    </Root>
  );
}
