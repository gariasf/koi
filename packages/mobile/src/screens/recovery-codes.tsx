/**
 * Recovery codes (sheet 06 §12.4) — the one-time reveal, and the page you land on
 * afterwards.
 *
 * The reveal copy is **exactly what the build already shipped** and moves intact; this
 * pass only changes where it lives. Codes are mono, tabular and selectable, with no
 * screenshot nag and no "copy to clipboard" as the primary action.
 *
 * What the design draws and this build cannot state: *"10 codes were created on 28
 * July."* Nothing stores that count or that date, so the page says what is true
 * instead of inventing a receipt. It is a smaller sentence, not a softer one — the
 * load-bearing half is that Koi cannot show them again.
 *
 * `§12.5 · Use a recovery code` — entering one — is **PROPOSED / NOT BUILT** (D-054,
 * proven server-side only). It is deliberately not reachable from here even as a
 * disabled row: an always-present door invites people to burn one-use codes they do
 * not need, so its only entrance is the failed-sign-in banner, once that exists.
 */

import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { generateRecoveryCodes } from '../auth/flow';
import { useKoi } from '../sync/provider';
import { Button, Card, PageHeader, Root } from '../ui/controls';
import { useKoiTheme } from '../ui/theme';
import { useToast } from '../ui/toast';

export default function RecoveryCodesScreen(): React.JSX.Element {
  const t = useKoiTheme();
  const router = useRouter();
  const toast = useToast();
  const { recoveryCodes, dismissRecoveryCodes } = useKoi();
  const [fresh, setFresh] = useState<readonly string[] | null>(null);
  const [busy, setBusy] = useState(false);

  const codes = fresh ?? recoveryCodes;

  const create = async (): Promise<void> => {
    setBusy(true);
    try {
      setFresh(await generateRecoveryCodes());
    } catch (e) {
      toast.showError(e instanceof Error ? e.message : 'Could not create new codes.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Root>
      <PageHeader back="Sync" onBack={() => router.back()} title="Recovery codes" />
      <View style={{ paddingHorizontal: t.gutter, paddingTop: t.space.lg, gap: t.space.lg }}>
        {codes === null ? (
          <>
            <Text style={t.type.body}>Koi cannot show your codes again.</Text>
            <Button
              label={busy ? 'Working…' : 'Create new codes'}
              disabled={busy}
              onPress={() => void create()}
            />
            <Text style={[t.type.soft, { textAlign: 'center' }]}>The old ones stop working.</Text>
          </>
        ) : (
          <>
            <Text style={t.type.title}>Save your recovery codes</Text>
            <Text style={t.type.soft}>
              If you lose access to every device with your passkey, one of these codes gets you back
              in. Each works once. Koi shows them only this one time.
            </Text>
            <Card>
              <Text style={[t.type.data, { lineHeight: 26, letterSpacing: 0.8 }]} selectable>
                {codes.join('\n')}
              </Text>
            </Card>
            <Button
              label="I've saved these"
              variant="primary"
              onPress={() => {
                setFresh(null);
                dismissRecoveryCodes();
              }}
            />
          </>
        )}
      </View>
    </Root>
  );
}
