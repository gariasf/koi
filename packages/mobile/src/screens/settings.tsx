/**
 * Settings (sheet 06) — the surface whose whole job is trustworthiness, so every
 * sentence on it has to survive being true.
 *
 * **One discriminator runs this screen: *has this device ever synced*, not "is sync
 * on".** Turning sync off is a pause — nothing already sent is clawed back, the
 * founding passkey outlives it, the account still exists. That is why the privacy card
 * has **three** states and not two: the middle one (synced before, sync now off) is
 * the state a real user reaches every single time they pause, and it is the one a
 * two-state design gets wrong. A card telling a device that *has* an account that it
 * has "no account, cloud sync or analytics" would break the sentences §H1 calls
 * product law (D-058).
 *
 * **One line never leaves.** D-006's floor — no ads, no trackers, no analytics, free
 * complete export, sync strictly opt-in — is true in all three states, so it gets its
 * own line and survives every switch. The card this replaces dropped the whole claim
 * the moment sync came on, which let a user infer analytics might now exist.
 *
 * **`Erase everything` becomes `Erase this device`** for any device that has ever
 * synced, and it turns sync off first and says so: with sync on, a local wipe
 * re-bootstraps from the checkpoint and the records come straight back. A mislabelled
 * destructive button is the worst possible place to promise something Koi cannot keep.
 * Typed `ERASE` and *There is no undo.* are §C8 verbatim in both.
 *
 * Rows the design draws that are **not** here, because their destinations are not
 * built and a row that goes nowhere is worse than an absent one: `Privacy ›` (the
 * release-gated privacy page, bucket F), Units, Currency, Notifications, Import from
 * MyCar, Export JSON, Export CSV. Appearance ships *with* the palette and not before
 * (D-059), which is why it is here now and was not before.
 */

import { useQuery } from '@powersync/react';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { OPEN_FLAG_COUNT_SQL } from '../data/flags';
import { useKoi } from '../sync/provider';
import { Button, Card, Confirm, FittedPick, Rule, SheetRow } from '../ui/controls';
import { useFormat } from '../ui/format';
import { SheetBody, SheetHeader } from '../ui/sheet';
import { useKoiTheme, type Appearance } from '../ui/theme';
import { useToast } from '../ui/toast';

const APPEARANCES: readonly { value: Appearance; label: string }[] = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

export default function SettingsScreen(): React.JSX.Element {
  const t = useKoiTheme();
  const f = useFormat();
  const router = useRouter();
  const toast = useToast();
  const { syncEnabled, everSynced, eraseThisDevice } = useKoi();
  const { data: flagCounts = [] } = useQuery<{ n: number }>(OPEN_FLAG_COUNT_SQL);
  const openFlags = flagCounts[0]?.n ?? 0;
  const [picking, setPicking] = useState(false);
  const [erasing, setErasing] = useState(false);

  const state = !everSynced ? 'never' : syncEnabled ? 'syncing' : 'paused';
  const version = `Koi ${Constants.expoConfig?.version ?? '0.1.0'} (1)`;

  return (
    <View style={{ flex: 1, backgroundColor: t.c.sheet }}>
      <SheetHeader title="Settings" cancelLabel="Done" onCancel={() => router.back()} />
      <SheetBody>
        <Card style={{ backgroundColor: t.c.paper }}>
          {/* The always-true line, in all three states. */}
          <Text style={t.type.body}>
            {state === 'never'
              ? 'Your data never leaves this device. No account, cloud sync or analytics. Export any time.'
              : 'No ads, trackers or analytics. Export any time.'}
          </Text>
          {state === 'syncing' && (
            <Text style={t.type.body}>
              This device syncs to your own server, so your other devices see the same records. It
              never leaves servers you run.
            </Text>
          )}
          {state === 'paused' && (
            <Text style={t.type.body}>
              Sync is paused. Records you already sent are still on your server.
            </Text>
          )}
        </Card>

        <View>
          <SheetRow
            label="Appearance"
            value={APPEARANCES.find((a) => a.value === t.appearance)?.label ?? 'System'}
            trailing="pick"
            onPress={() => setPicking(true)}
          />
          <SheetRow
            label="Sync"
            value={state === 'syncing' ? 'On' : state === 'paused' ? 'Paused' : 'Off'}
            onPress={() => router.push('/settings/sync')}
            last
          />
        </View>

        <View>
          <SheetRow
            label="Review notes"
            value={openFlags === 0 ? 'None waiting' : f.integer(openFlags)}
            onPress={() => router.push('/settings/review')}
            last
          />
        </View>

        <View style={{ paddingTop: t.space.md }}>
          <Button
            label={everSynced ? 'Erase this device' : 'Erase everything'}
            variant="destructive"
            onPress={() => setErasing(true)}
          />
        </View>

        <Rule />
        <Text style={t.type.dataFaint}>{version}</Text>
      </SheetBody>

      <FittedPick
        visible={picking}
        options={APPEARANCES}
        selected={t.appearance}
        onSelect={t.setAppearance}
        onClose={() => setPicking(false)}
      />

      <Confirm
        visible={erasing}
        title={everSynced ? 'Erase this device?' : 'Erase everything?'}
        body={
          everSynced
            ? [
                "Sync is turned off first, so your server can't send the records back.",
                'This deletes everything on this device. Records already on your server stay there.',
              ]
            : [
                'This deletes every car, record, reminder and document on this device. There is no undo.',
              ]
        }
        confirmLabel="Erase"
        typedPhrase="ERASE"
        onCancel={() => setErasing(false)}
        onConfirm={() => {
          setErasing(false);
          void (async () => {
            await eraseThisDevice();
            toast.show('Everything on this device is erased.');
            router.back();
          })();
        }}
      />
    </View>
  );
}
