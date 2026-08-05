/**
 * Sync (sheet 06 §02) — pushed inside the Settings sheet, three states.
 *
 * Called **`Sync`**, not "Sync & devices": there is no device registry, only this
 * device's id, and a title promising a list Koi cannot produce is the wrong thing to
 * put on the trust surface (D-058).
 *
 * Three corrections to what the build shipped, each because the old version was not
 * true:
 *
 *  - **No pending count in the never-synced state.** The old line read the upload
 *    queue and called it "N records kept here so far" — but `ps_crud` is an upload
 *    *queue*, so a created-then-edited record counts twice and the line over-reports.
 *    A count only means something once there is a server to reach, which is why it
 *    appears as *Waiting to send* and only while syncing (§D5: sums that would lie
 *    are withheld).
 *  - **The two-Face-ID stutter gets a sentence**, in the never-synced state only:
 *    registering a passkey does not sign you in, so a fresh device does both steps.
 *    A device that already has a working passkey never sees it again (D-055 is the
 *    real fix and is still a server obligation).
 *  - **Failure has no badge**, here or anywhere in the shell. The sentence lives on
 *    this page, and the consequence is recorded rather than smuggled around: a user
 *    whose sync has been broken for days finds out on a visit here.
 *
 * Neither direction asks for confirmation: enabling costs nothing undoable, disabling
 * only pauses future uploads. And the page it leaves behind is the **paused** state,
 * never the never-synced one.
 */

import { useQuery, useStatus } from '@powersync/react';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { useKoi } from '../sync/provider';
import { Button, FactRow, PageHeader, Root, SectionLabel, SheetRow } from '../ui/controls';
import { useFormat } from '../ui/format';
import { useKoiTheme } from '../ui/theme';
import { useToast } from '../ui/toast';

export default function SyncScreen(): React.JSX.Element {
  const t = useKoiTheme();
  const f = useFormat();
  const router = useRouter();
  const toast = useToast();
  const { deviceId, syncEnabled, everSynced, connectError, enableSync, disableSync } = useKoi();
  const status = useStatus();
  const [busy, setBusy] = useState(false);

  // `ps_crud` is PowerSync's own local upload queue — a real table, live like any
  // other query. It fills from the very first write regardless of connection, which
  // is what makes turning sync on later a single connect() call (D-052).
  const { data: pending = [] } = useQuery<{ n: number }>(`SELECT count(*) AS n FROM ps_crud`);
  const waiting = pending[0]?.n ?? 0;

  const state = !everSynced ? 'never' : syncEnabled ? 'syncing' : 'paused';

  const turnOn = async (): Promise<void> => {
    setBusy(true);
    try {
      await enableSync();
    } catch (e) {
      toast.showError(
        `Not syncing: ${e instanceof Error ? e.message : String(e)}. Your records are safe on this device.`,
        () => void turnOn(),
      );
    } finally {
      setBusy(false);
    }
  };

  const turnOff = async (): Promise<void> => {
    setBusy(true);
    try {
      await disableSync();
      toast.show('Sync paused. Records already sent stay on the server.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Root>
      <PageHeader back="Settings" onBack={() => router.back()} title="Sync" />
      <View style={{ paddingHorizontal: t.gutter, paddingTop: t.space.lg, gap: t.space.lg }}>
        <Text style={t.type.body}>
          {state === 'never'
            ? 'Your data never leaves this device. No account, cloud sync or analytics.'
            : state === 'syncing'
              ? 'This device syncs to your own server, so your other devices see the same records. It never leaves servers you run.'
              : 'Sync is paused. Records you already sent are still on your server.'}
        </Text>

        {state === 'syncing' ? (
          <View>
            <FactRow
              label="Status"
              value={
                connectError !== null ? 'Not connected' : status.connected ? 'Syncing' : 'Connecting…'
              }
            />
            {waiting > 0 && (
              <FactRow label="Waiting to send" value={f.count(waiting, 'change')} />
            )}
            <FactRow
              label="First sync"
              value={status.hasSynced === true ? 'done' : 'not yet'}
              last
            />
          </View>
        ) : (
          <Button
            label={busy ? 'Working…' : state === 'paused' ? 'Turn sync back on' : 'Turn on sync'}
            variant="primary"
            disabled={busy}
            onPress={() => void turnOn()}
          />
        )}

        {connectError !== null && state === 'syncing' && (
          <Text style={t.type.soft}>
            Not syncing: {connectError}. Your records are safe on this device.
          </Text>
        )}

        {state === 'never' && (
          <Text style={t.type.soft}>
            Turning sync on signs you in with a passkey — Koi creates one on your first device and
            reuses it on the others. Your phone asks for Face ID; the very first device asks twice.
          </Text>
        )}

        {everSynced && (
          <View>
            <SheetRow
              label="Recovery codes"
              onPress={() => router.push('/settings/recovery-codes')}
              last
            />
          </View>
        )}

        {state === 'syncing' && (
          <Button
            label={busy ? 'Working…' : 'Turn off sync'}
            disabled={busy}
            onPress={() => void turnOff()}
          />
        )}

        <View style={{ paddingTop: t.space.md, gap: 6 }}>
          <SectionLabel>This device</SectionLabel>
          {/* The OS device name the design pairs with the id needs `expo-device`,
              which this session did not sanction — so the id is shown short and the
              full value stays selectable rather than being half-invented. */}
          <Text style={t.type.data} selectable>
            {deviceId.slice(-6)}
          </Text>
          <Text style={t.type.dataFaint} selectable>
            {deviceId}
          </Text>
        </View>
      </View>
    </Root>
  );
}
