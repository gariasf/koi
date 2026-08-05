/**
 * Capture → Odometer (sheet 07) — the one capture surface whose table exists.
 *
 * **One odometer surface, two doors**: this sheet, reached from `+` and from the car
 * page's odometer card, prefilled differently. A second implementation of the same
 * task is how two surfaces drift apart.
 *
 * The five odometer-well states are the app's whole odometer behaviour, not one
 * screen's, and every one of them is a **sentence** rather than a styled error:
 *
 *  1. **first reading ever** — no delta to state, so it states the consequence:
 *     *Koi will measure from here.*
 *  2. **hard stop** — the field takes a critical border and the message **names the
 *     conflicting record** and offers the door to it. Nothing turns red; this is the
 *     one place critical is earned outside a destructive confirmation.
 *  3. **soft** — a jump over 5.000 km *asks*, it does not block: *Does that look
 *     right?* with `Save anyway` / `Go back`. A soft-confirmed value is **saved as
 *     typed**, never adjusted afterwards.
 *  4. **left empty** — Save stays disabled; there is nothing to state.
 *  5. **editing this record's own reading** — inv.10: the record's own reading is
 *     **excluded** from the monotonicity check. Without that exclusion, noticing a
 *     mistyped digit after saving would be permanently blocked by a check naming the
 *     record's own value as "the conflict".
 *
 * The keypad is Koi's own, with a locale decimal key on the surfaces that need one —
 * the system keyboard cannot be trusted to offer `,`, and money parsing is a 1000×
 * corruption class (inv.20). Kilometres are whole, so the decimal key is off here and
 * its slot stays empty rather than shifting the digits.
 *
 * Client and server run the same pure function (`checkOdometerReading`): the server
 * would accept a bad write and flag it, so refusing it here is what keeps the user's
 * own device honest **without repairing anything silently**.
 */

import { addDays, checkOdometerReading } from '@koi/domain';
import { useQuery } from '@powersync/react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Text, View } from 'react-native';

import { todayCivil } from '../clock';
import { carTitle, type CarRow } from '../data/cars';
import { insertReading, updateReading, type ReadingRow } from '../data/readings';
import { newId } from '../data/ids';
import { useKoi } from '../sync/provider';
import {
  Button,
  Chip,
  ChipRow,
  FittedPick,
  SectionLabel,
  ValueBox,
} from '../ui/controls';
import { useFormat } from '../ui/format';
import { Keypad } from '../ui/keypad';
import { SheetBody, SheetHeader, useDirtyGuard } from '../ui/sheet';
import { useKoiTheme } from '../ui/theme';
import { useToast } from '../ui/toast';

/** §7.7's soft threshold: ask above this, never block. */
const SOFT_JUMP_KM = 5000;
/** How far back the date pick offers. See the note on the pick itself. */
const BACKDATE_DAYS = 14;

export default function OdometerSheet(): React.JSX.Element {
  const params = useLocalSearchParams<{ car?: string; reading?: string }>();
  const t = useKoiTheme();
  const f = useFormat();
  const router = useRouter();
  const toast = useToast();
  const { db, deviceId } = useKoi();

  const { data: cars = [] } = useQuery<CarRow>(
    `SELECT * FROM cars WHERE archived_at IS NULL ORDER BY make, model`,
  );
  const { data: editRows = [] } = useQuery<ReadingRow>(
    `SELECT * FROM odometer_readings WHERE id = ?`,
    [params.reading ?? ''],
  );
  const editing = editRows[0];

  const [pickedCar, setPickedCar] = useState<string | null>(null);
  const [pickingCar, setPickingCar] = useState(false);
  const [pickingDate, setPickingDate] = useState(false);
  const [km, setKm] = useState('');
  const [date, setDate] = useState(todayCivil());
  const [touched, setTouched] = useState(false);
  const [hard, setHard] = useState<{ message: string; conflictId: string | null } | null>(null);
  const [soft, setSoft] = useState<string | null>(null);
  const seededId = useRef<string | null>(null);

  const carId = pickedCar ?? editing?.car_id ?? params.car ?? cars[0]?.id ?? null;
  const car = cars.find((c) => c.id === carId);

  const { data: readings = [] } = useQuery<ReadingRow>(
    `SELECT * FROM odometer_readings WHERE car_id = ? ORDER BY recorded_date DESC, reading_km DESC`,
    [carId ?? ''],
  );

  // Seeded once per record, then owned by the sheet — the query behind it is live, and
  // guarding on the id (not the row object, whose identity changes every tick) is also
  // what lets "Open that record" re-seed when it swaps which reading is being edited.
  useEffect(() => {
    if (editing === undefined || seededId.current === editing.id) return;
    seededId.current = editing.id;
    setKm(String(editing.reading_km));
    setDate(editing.recorded_date);
    setTouched(false);
  }, [editing]);

  /**
   * inv.10, the edit exclusion: this record's own reading leaves the trail the check
   * runs against. The hard stop applies to **new** readings only.
   */
  const trail = useMemo(
    () =>
      readings
        .filter((r) => r.id !== editing?.id)
        .map((r) => ({ readingKm: r.reading_km, recordedDate: r.recorded_date })),
    [readings, editing?.id],
  );

  const value = f.parseKm(km);
  const whole = value === null ? null : Math.round(value);

  /** The last reading at or before the entered date — the delta's basis. */
  const previous = useMemo(
    () =>
      readings
        .filter((r) => r.id !== editing?.id && r.recorded_date <= date)
        .sort((a, b) =>
          a.recorded_date === b.recorded_date
            ? b.reading_km - a.reading_km
            : a.recorded_date < b.recorded_date
              ? 1
              : -1,
        )[0] ?? null,
    [readings, date, editing?.id],
  );

  /**
   * Which record a violation points at. The *rule* stays in `@koi/domain` — this only
   * answers "and which row is that", so the sheet can name it and offer to open it.
   */
  const conflicting = (kind: string): ReadingRow | null => {
    const others = readings.filter((r) => r.id !== editing?.id);
    if (whole === null) return null;
    if (kind === 'odometer-same-date-conflict') {
      return others.find((r) => r.recorded_date === date) ?? null;
    }
    if (kind === 'odometer-backwards') {
      return (
        others
          .filter((r) => r.recorded_date < date)
          .reduce<ReadingRow | null>((a, r) => (a === null || r.reading_km > a.reading_km ? r : a), null)
      );
    }
    if (kind === 'odometer-ahead') {
      return (
        others
          .filter((r) => r.recorded_date > date)
          .reduce<ReadingRow | null>((a, r) => (a === null || r.reading_km < a.reading_km ? r : a), null)
      );
    }
    return null;
  };

  const leave = (): void => {
    router.back();
  };
  const { requestExit, guard } = useDirtyGuard(touched, 'reading', leave);

  const type = (digit: string): void => {
    setTouched(true);
    setHard(null);
    setSoft(null);
    setKm((current) => (current === '0' ? digit : current + digit));
  };
  const backspace = (): void => {
    setTouched(true);
    setHard(null);
    setSoft(null);
    setKm((current) => current.slice(0, -1));
  };

  const save = (confirmSoft = false): void => {
    if (whole === null || carId === null) return;
    const violation = checkOdometerReading(trail, { readingKm: whole, recordedDate: date });
    if (violation !== null) {
      const row = conflicting(violation.kind);
      setHard({
        message:
          row === null
            ? violation.message
            : `A reading on ${f.dayMonthLong(row.recorded_date)} says ${f.km(row.reading_km)}.`,
        conflictId: row?.id ?? null,
      });
      return;
    }
    const jump = previous === null ? 0 : whole - previous.reading_km;
    if (!confirmSoft && jump > SOFT_JUMP_KM) {
      setSoft(`${f.kmDelta(jump)} since ${f.dayMonthLong(previous?.recorded_date ?? date)}.`);
      return;
    }
    void (async () => {
      if (editing !== undefined) {
        await updateReading(db, editing.id, { readingKm: whole, recordedDate: date });
      } else {
        await insertReading(db, {
          id: newId(),
          carId,
          readingKm: whole,
          recordedDate: date,
          deviceId,
        });
      }
      setTouched(false);
      // An edit gets no ceremony — it saves quietly and the sheet closes. Ceremony
      // is for creation, and the fuel-capture spring is the only one in the app.
      toast.show(editing === undefined ? 'Reading saved.' : 'Reading updated.');
      leave();
    })();
  };

  const dateOptions = useMemo(() => {
    const days: { value: string; label: string; meta?: string }[] = [];
    const today = todayCivil();
    for (let back = 0; back < BACKDATE_DAYS; back += 1) {
      // `addDays` from @koi/domain: civil-date integer math, no Date and no timezone.
      const day = addDays(today, -back);
      days.push({
        value: day,
        label: back === 0 ? 'Today' : back === 1 ? 'Yesterday' : f.dayMonthLong(day),
        ...(back <= 1 ? { meta: f.dayMonthLong(day) } : {}),
      });
    }
    return days;
  }, [f]);

  const delta =
    previous === null
      ? 'Koi will measure from here.'
      : whole === null
        ? `Last reading ${f.km(previous.reading_km)} on ${f.dayMonthLong(previous.recorded_date)}.`
        : `${f.kmDelta(whole - previous.reading_km)} since ${f.dayMonthLong(previous.recorded_date)}.`;

  return (
    <View style={{ flex: 1, backgroundColor: t.c.sheet }}>
      <SheetHeader
        title="Odometer"
        onCancel={requestExit}
        onSave={() => save()}
        saveDisabled={whole === null || whole <= 0 || carId === null}
      />
      <SheetBody scroll={false}>
        <View style={{ padding: t.gutter, gap: t.space.md, flex: 1 }}>
          {/* The car picker renders only when a second car exists — article 8, and a
              rendering rule rather than a disabled state. */}
          {cars.length > 1 && car !== undefined && (
            <ChipRow>
              <Chip
                label={carTitle(car)}
                species="filter"
                trailing="▾"
                onPress={() => setPickingCar(true)}
              />
            </ChipRow>
          )}

          <ValueBox
            value={km === '' ? '' : f.integer(Number(km))}
            placeholder=""
            suffix="km"
            entered={km !== ''}
            error={hard !== null}
          />

          {hard !== null ? (
            <View style={{ gap: t.space.sm }}>
              <Text style={[t.type.soft, { color: t.c.critical }]}>{hard.message}</Text>
              {hard.conflictId !== null && (
                <Button
                  label="Open that record"
                  pill
                  compact
                  style={{ alignSelf: 'flex-start' }}
                  onPress={() => {
                    // Record pages are batch 2, so "open it" opens the same sheet on
                    // that reading — which is the honest action anyway: go look at it,
                    // and the edit exclusion makes it editable once you are there.
                    const target = hard.conflictId;
                    setHard(null);
                    if (target !== null) router.replace(`/capture/odometer?reading=${target}`);
                  }}
                />
              )}
            </View>
          ) : soft !== null ? (
            <View style={{ gap: t.space.sm }}>
              <Text style={t.type.soft}>
                {soft} <Text style={{ color: t.c.attention }}>Does that look right?</Text>
              </Text>
              <View style={{ flexDirection: 'row', gap: t.space.sm }}>
                <Button label="Save anyway" pill compact onPress={() => save(true)} />
                <Button
                  label="Go back"
                  variant="ghost"
                  compact
                  onPress={() => setSoft(null)}
                />
              </View>
            </View>
          ) : (
            <Text style={t.type.soft}>
              {editing === undefined
                ? delta
                : 'Editing a saved reading. Correcting it down or up is always allowed here.'}
            </Text>
          )}

          <View style={{ gap: t.space.xs }}>
            <SectionLabel>Date</SectionLabel>
            <ChipRow>
              <Chip
                label={f.dayMonthLong(date)}
                species="filter"
                trailing="▾"
                onPress={() => setPickingDate(true)}
              />
            </ChipRow>
          </View>
        </View>

        <Keypad decimal={false} onDigit={type} onBackspace={backspace} />
      </SheetBody>

      <FittedPick
        visible={pickingCar}
        title="Which car?"
        options={cars.map((c) => ({ value: c.id, label: carTitle(c) }))}
        selected={carId ?? ''}
        onSelect={(value) => {
          setPickedCar(value);
          setHard(null);
          setSoft(null);
        }}
        onClose={() => setPickingCar(false)}
      />
      {/* A fourteen-day list rather than a calendar: a real date picker is a new
          dependency this session did not sanction, and the pill's own rule is
          "backdatable and never future", which a list honours exactly. Older dates
          wait for the picker. */}
      <FittedPick
        visible={pickingDate}
        title="When?"
        options={dateOptions}
        selected={date}
        onSelect={(value) => {
          setTouched(true);
          setHard(null);
          setSoft(null);
          setDate(value);
        }}
        onClose={() => setPickingDate(false)}
      />
      {guard}
    </View>
  );
}
