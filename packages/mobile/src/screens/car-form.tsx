/**
 * The car form (sheet 04 §04) — one sheet, add and edit.
 *
 * Three fields up top, everything else below a rule. Two corrections to what the
 * build shipped ride in here:
 *
 *  - **Fuel type is an enum, entered by chip.** It was free text, which meant the
 *    client half of "flag, never fix" was applied to readings and not to cars — a
 *    typo like `petrol ` reached the server and passed as a distinct fuel type.
 *  - **The odometer field is a `baseline`, not a reading.** Relabelled *Odometer at
 *    acquisition*, with a sentence saying so. New readings are only ever minted by
 *    the odometer sheet; a field here that quietly minted one would break inv.7's
 *    fold rule from the very first screen.
 *
 * Archive and Remove sit together in the foot and are never conflated (inv.30).
 * **Archive** shelves: kept, restorable, out of the all-cars feed, one tap brings its
 * records back. **Remove** purges, demands the car's **own name** typed, and has no
 * undo — a car never resurrects via PUT server-side, so offering one would be a
 * promise Koi cannot keep.
 *
 * Validation is at the door: empty make or model, and the §B2 bounds through
 * `checkCarFields` — the same pure function the server runs on upload.
 */

import { checkCarFields } from '@koi/domain';
import { useQuery } from '@powersync/react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Text, View } from 'react-native';

import { nowIso, todayCivil } from '../clock';
import {
  archiveCar,
  carTitle,
  deleteCarWithReadings,
  insertCar,
  restoreCar,
  updateCar,
  type CarRow,
} from '../data/cars';
import { newId } from '../data/ids';
import { useKoi } from '../sync/provider';
import { Button, Chip, ChipRow, Confirm, Field, Rule, SectionLabel } from '../ui/controls';
import { useFormat } from '../ui/format';
import { SheetBody, SheetHeader, useDirtyGuard } from '../ui/sheet';
import { useKoiTheme } from '../ui/theme';
import { useToast } from '../ui/toast';

/**
 * §B1's canonical fuel types, in the order the design's chip row draws the four that
 * matter. The rest of the enum stays in the server's zod schema until a car needs it —
 * a chip row of nine is a taxonomy, and §C4's whole posture is that Koi has none.
 */
const FUEL_TYPES = ['petrol', 'diesel', 'electric', 'hybrid'] as const;
const FUEL_LABELS: Record<(typeof FUEL_TYPES)[number], string> = {
  petrol: 'Petrol',
  diesel: 'Diesel',
  electric: 'Electric',
  hybrid: 'Hybrid',
};

export default function CarFormScreen(): React.JSX.Element {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const t = useKoiTheme();
  const f = useFormat();
  const router = useRouter();
  const toast = useToast();
  const { db } = useKoi();
  const editing = id !== undefined && id !== '';

  const { data: cars = [] } = useQuery<CarRow>(
    `SELECT * FROM cars WHERE id = ?`,
    [id ?? ''],
  );
  const car = cars[0];

  // Seeded once from the row, then owned by the form: the query is live, so a
  // version of this that kept copying the row into the fields would fight the
  // user's typing on every sync tick. Guarded on the id rather than on the row
  // object, whose identity changes on every tick by design.
  const seededId = useRef<string | null>(null);
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [fuelType, setFuelType] = useState<string>('petrol');
  const [nickname, setNickname] = useState('');
  const [plate, setPlate] = useState('');
  const [year, setYear] = useState('');
  const [tank, setTank] = useState('');
  const [baseline, setBaseline] = useState('');
  const [touched, setTouched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<'remove' | 'archive' | null>(null);

  useEffect(() => {
    if (car === undefined || seededId.current === car.id) return;
    seededId.current = car.id;
    setMake(car.make);
    setModel(car.model);
    setFuelType(car.fuel_type);
    setNickname(car.nickname ?? '');
    setPlate(car.plate ?? '');
    setYear(car.year === null ? '' : String(car.year));
    setTank(car.tank_capacity_l === null ? '' : String(car.tank_capacity_l));
    setBaseline(car.initial_odometer_km === null ? '' : String(car.initial_odometer_km));
  }, [car]);

  const leave = (): void => {
    router.back();
  };
  const { requestExit, guard } = useDirtyGuard(touched, editing ? 'edit' : 'car', leave);

  const edit = <T,>(setter: (v: T) => void) => (value: T) => {
    setTouched(true);
    setter(value);
  };

  const optionalInt = (raw: string): number | null => {
    const parsed = f.parseKm(raw);
    return parsed === null ? null : Math.round(parsed);
  };

  const canSave = make.trim() !== '' && model.trim() !== '';

  const save = async (): Promise<void> => {
    const values = {
      year: optionalInt(year),
      tankCapacityL: optionalInt(tank),
      initialOdometerKm: optionalInt(baseline),
    };
    const violations = checkCarFields(values, {
      currentYear: Number(todayCivil().slice(0, 4)),
    });
    const first = violations[0];
    if (first !== undefined) {
      setError(first.message);
      return;
    }
    setError(null);
    if (editing && car !== undefined) {
      await updateCar(db, car.id, {
        make: make.trim(),
        model: model.trim(),
        fuel_type: fuelType,
        nickname: nickname.trim() === '' ? null : nickname.trim(),
        plate: plate.trim() === '' ? null : plate.trim(),
        year: values.year,
        tank_capacity_l: values.tankCapacityL,
        initial_odometer_km: values.initialOdometerKm,
      });
    } else {
      await insertCar(db, {
        id: newId(),
        make: make.trim(),
        model: model.trim(),
        fuelType,
        nickname: nickname.trim() === '' ? null : nickname.trim(),
        plate: plate.trim() === '' ? null : plate.trim(),
        year: values.year,
        tankCapacityL: values.tankCapacityL,
        initialOdometerKm: values.initialOdometerKm,
      });
    }
    setTouched(false);
    leave();
  };

  const name = car === undefined ? model.trim() : carTitle(car);

  return (
    <View style={{ flex: 1, backgroundColor: t.c.sheet }}>
      <SheetHeader
        title={editing ? 'Edit car' : 'Add a car'}
        cancelLabel="Cancel"
        onCancel={requestExit}
        onSave={() => void save()}
        saveDisabled={!canSave}
      />
      <SheetBody>
        {!editing && <Text style={t.type.body}>Three fields. Everything else can wait.</Text>}

        <View style={{ flexDirection: 'row', gap: t.space.md }}>
          <View style={{ flex: 1 }}>
            <Field label="Make" value={make} onChangeText={edit(setMake)} placeholder="VW" autoCapitalize="words" />
          </View>
          <View style={{ flex: 1 }}>
            <Field
              label="Model"
              value={model}
              onChangeText={edit(setModel)}
              placeholder="Golf GTI"
              autoCapitalize="words"
            />
          </View>
        </View>

        <View style={{ gap: t.space.sm }}>
          <SectionLabel>Fuel</SectionLabel>
          <ChipRow>
            {FUEL_TYPES.map((value) => (
              <Chip
                key={value}
                label={FUEL_LABELS[value]}
                species="option"
                selected={fuelType === value}
                onPress={() => edit(setFuelType)(value)}
              />
            ))}
          </ChipRow>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.space.md }}>
          <Rule style={{ flex: 1 }} />
          <Text style={[t.type.dataFaint]}>everything else</Text>
          <Rule style={{ flex: 1 }} />
        </View>

        <Field label="Name it" value={nickname} onChangeText={edit(setNickname)} placeholder={model} />
        <Field
          label="Plate"
          value={plate}
          onChangeText={edit(setPlate)}
          placeholder="1234-ABC"
          autoCapitalize="characters"
        />
        <View style={{ flexDirection: 'row', gap: t.space.md }}>
          <View style={{ flex: 1 }}>
            <Field
              label="Year"
              value={year}
              onChangeText={edit(setYear)}
              keyboardType="number-pad"
              mono
              placeholder="2019"
            />
          </View>
          <View style={{ flex: 1 }}>
            <Field
              label="Tank"
              value={tank}
              onChangeText={edit(setTank)}
              keyboardType="number-pad"
              mono
              suffix="L"
            />
          </View>
        </View>

        <Field
          label="Odometer at acquisition"
          value={baseline}
          onChangeText={edit(setBaseline)}
          keyboardType="number-pad"
          mono
          suffix="km"
        />
        <Text style={t.type.faint}>
          The baseline Koi measures from. New readings come from the odometer sheet.
        </Text>

        {error !== null && <Text style={[t.type.soft, { color: t.c.critical }]}>{error}</Text>}

        {editing && car !== undefined && (
          <View style={{ gap: t.space.sm, paddingTop: t.space.lg }}>
            <Rule />
            {car.archived_at === null ? (
              <Button
                label="Archive this car"
                onPress={() => setConfirming('archive')}
                style={{ marginTop: t.space.md }}
              />
            ) : (
              <Button
                label="Restore this car"
                onPress={() => {
                  void restoreCar(db, car.id);
                  toast.show(`${carTitle(car)} is back in your garage.`);
                  leave();
                }}
                style={{ marginTop: t.space.md }}
              />
            )}
            <Button
              label="Remove this car"
              variant="destructive"
              onPress={() => setConfirming('remove')}
            />
          </View>
        )}
      </SheetBody>

      <Confirm
        visible={confirming === 'archive'}
        title={`Archive ${name}?`}
        body={[
          'It leaves your garage and your totals, and keeps every record.',
          'One tap brings it back.',
        ]}
        confirmLabel="Archive"
        cancelLabel="Keep it here"
        onCancel={() => setConfirming(null)}
        onConfirm={() => {
          if (car === undefined) return;
          setConfirming(null);
          void archiveCar(db, car.id, nowIso());
          toast.show(`${name} is archived. Its records are kept.`);
          leave();
        }}
      />
      <Confirm
        visible={confirming === 'remove'}
        title={`Remove ${name}?`}
        body={[
          'This deletes the car and its records. There is no undo.',
          'Archive keeps everything instead.',
        ]}
        confirmLabel="Remove"
        typedPhrase={name}
        onCancel={() => setConfirming(null)}
        onConfirm={() => {
          if (car === undefined) return;
          setConfirming(null);
          void (async () => {
            const children = await deleteCarWithReadings(db, car.id);
            // No Undo rides this toast: a car delete has none (inv.30), and
            // offering one would be a promise Koi cannot keep.
            toast.show(
              children > 0
                ? `Car deleted, with ${f.count(children, 'reading')}.`
                : 'Car deleted.',
            );
            // The car page underneath is about a car that no longer exists, so the
            // form does not just close: it closes and lands on the Garage. The
            // message rides the app-level toast rather than a route param, which is
            // the smuggling the toast host exists to end.
            router.dismissAll();
            router.navigate('/garage');
          })();
        }}
      />
      {guard}
    </View>
  );
}
