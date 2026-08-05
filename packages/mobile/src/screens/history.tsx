/**
 * History — the tab exists because the shell is four tabs, and the ledger it holds
 * does not exist yet.
 *
 * The month-grouped feed, the row anatomy per record kind, the swipe, the plan-charge
 * row and the two empty states are all designed (sheet 09) and all blocked on the
 * §B1 record tables: fuel, service, expense, contract, trip, note. Those are their own
 * batch — new-table work, not an architecture change.
 *
 * So this screen says what is true rather than drawing a feed of one record kind and
 * calling it the ledger. The second line is not a roadmap note: it tells the reader
 * where the records they *do* have actually are, which is the honest half of a stated
 * absence (§D5).
 */

import { useRouter } from 'expo-router';
import { Text } from 'react-native';

import { Gutter, Root, RootHeader } from '../ui/controls';
import { useKoiTheme } from '../ui/theme';

export default function HistoryScreen(): React.JSX.Element {
  const t = useKoiTheme();
  const router = useRouter();
  return (
    <Root>
      <RootHeader title="History" onSettings={() => router.push('/settings')} />
      <Gutter style={{ paddingTop: t.space.xxl, gap: t.space.sm }}>
        <Text style={[t.type.title, { fontSize: 19 }]}>Nothing to show here yet.</Text>
        <Text style={t.type.soft}>
          Every fill, service and note you add lands here, newest first.
        </Text>
        <Text style={t.type.soft}>
          Your odometer readings are on each car&apos;s own page until then.
        </Text>
      </Gutter>
    </Root>
  );
}
