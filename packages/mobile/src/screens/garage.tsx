/**
 * Garage — **the cars**, and nothing else (sheet 04 §01).
 *
 * No sync card, no review card, no dashboard: those moved to the Settings sheet and
 * to Home's state machine where sheets 03 and 06 put them. This screen previously
 * carried all three, and each one was explicitly a stand-in.
 *
 * What the design asks for and this schema cannot yet supply, stated rather than
 * faked: a car has no photo column, no ownership kind, no plan and no cap, so the
 * card carries the warm placeholder block, the identity line, and no status chips.
 * The `PLAN` / `OWNERSHIP` groups and the cap chip arrive with the tables behind
 * them — a chip reading `Owned` on a car whose ownership Koi has never been told
 * would be an invention, which is the one thing this product does not do.
 *
 * Three things here ARE the design, and each one fixes a live contradiction:
 *
 *  - **Car cards stop wearing the fuel green.** The photo is identity, never data,
 *    and spending the app's one green on a car breaks the colour law.
 *  - **Archived cars are rows, not dimmed cards.** Dimming a photo card reads as
 *    broken; a row reads as *shelved*. Restore is one tap and brings every record
 *    with it.
 *  - **A single-car garage is still a list of one**, not a promoted dashboard.
 */

import { useQuery } from '@powersync/react';
import { useRouter } from 'expo-router';
import { useStatus } from '@powersync/react';
import { Pressable, Text, View } from 'react-native';

import { CARS_ORDERED_SQL, carTitle, restoreCar, type CarListRow } from '../data/cars';
import { useKoi } from '../sync/provider';
import {
  BrandMark,
  Button,
  Card,
  Empty,
  Fab,
  Gutter,
  PhotoPlaceholder,
  Root,
  RootHeader,
  Row,
  SectionLabel,
} from '../ui/controls';
import { useFormat } from '../ui/format';
import { CarWell } from '../ui/icons';
import { useKoiTheme } from '../ui/theme';
import { useToast } from '../ui/toast';

export default function GarageScreen(): React.JSX.Element {
  const t = useKoiTheme();
  const f = useFormat();
  const router = useRouter();
  const toast = useToast();
  const { db, syncEnabled } = useKoi();
  const status = useStatus();
  const { data: cars = [] } = useQuery<CarListRow>(CARS_ORDERED_SQL);

  const live = cars.filter((c) => c.archived_at === null);
  const archived = cars.filter((c) => c.archived_at !== null);

  const identity = (car: CarListRow): string =>
    [`${car.make} ${car.model}`, car.year === null ? null : String(car.year), car.plate]
      .filter((part): part is string => part !== null && part !== '')
      .join(' · ');

  return (
    <View style={{ flex: 1, backgroundColor: t.c.paper }}>
      <Root>
        <RootHeader title="Garage" onSettings={() => router.push('/settings')} />

        {live.length === 0 && archived.length === 0 ? (
          <ZeroCars synced={syncEnabled && status.hasSynced === true} />
        ) : (
          <Gutter style={{ paddingTop: t.space.lg, gap: t.space.md }}>
            {live.map((car) => (
              <Pressable
                key={car.id}
                accessibilityRole="button"
                onPress={() => router.push(`/garage/car/${car.id}`)}
                style={({ pressed }) => (pressed ? { opacity: 0.85 } : undefined)}
              >
                <Card style={{ padding: 0, overflow: 'hidden', gap: 0 }}>
                  <PhotoPlaceholder height={132} />
                  <View style={{ padding: 15, gap: 4 }}>
                    <Text style={[t.type.title, { fontSize: 19 }]}>{carTitle(car)}</Text>
                    <Text style={t.type.dataSoft}>{identity(car)}</Text>
                  </View>
                </Card>
              </Pressable>
            ))}
          </Gutter>
        )}

        {(live.length > 0 || archived.length > 0) && (
          <Gutter style={{ paddingTop: t.space.lg, alignItems: 'center' }}>
            <Button label="Add a car" onPress={() => router.push('/car-form')} />
          </Gutter>
        )}

        {archived.length > 0 && (
          <Gutter style={{ paddingTop: t.space.xl, gap: t.space.xs }}>
            <SectionLabel>Archived</SectionLabel>
            {archived.map((car) => (
              <Row
                key={car.id}
                well={<CarWell dim />}
                title={carTitle(car)}
                dim
                meta={`Archived ${car.archived_at === null ? '' : f.year(car.archived_at.slice(0, 10))} · records kept`}
                metaTone="faint"
                onPress={() => router.push(`/garage/car/${car.id}`)}
                trailing={
                  <Button
                    label="Restore"
                    variant="ghost"
                    pill
                    compact
                    onPress={() => {
                      void restoreCar(db, car.id);
                      toast.show(`${carTitle(car)} is back in your garage.`);
                    }}
                  />
                }
              />
            ))}
          </Gutter>
        )}
      </Root>
      <Fab onPress={() => router.push(live.length === 0 ? '/car-form' : '/capture/odometer')} />
    </View>
  );
}

/**
 * Zero cars. **The one empty state that is easy to miss**: a signed-in second device
 * with nothing arrived yet must not read *Add your car to begin* — that invites the
 * duplicate-car outcome the architecture deliberately will not auto-resolve (annex A).
 */
function ZeroCars({ synced }: { synced: boolean }): React.JSX.Element {
  const t = useKoiTheme();
  const router = useRouter();
  return (
    <Gutter style={{ paddingTop: 76, alignItems: 'center', gap: t.space.md }}>
      <BrandMark />
      <Text style={[t.type.title, { fontSize: 20, textAlign: 'center', marginTop: t.space.md }]}>
        {synced ? 'Waiting for your records to arrive.' : 'Add your car to begin.'}
      </Text>
      {synced ? (
        <Empty>Nothing has come down from your server yet.</Empty>
      ) : (
        <Button
          label="Add a car"
          variant="primary"
          onPress={() => router.push('/car-form')}
          style={{ marginTop: t.space.md, paddingHorizontal: 30 }}
        />
      )}
    </Gutter>
  );
}
