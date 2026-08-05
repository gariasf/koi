/**
 * Insights — the tab exists; the four lenses do not.
 *
 * Cost, Fuel, Distance and Ownership are drawn in full (sheet 10), and every one of
 * them measures records this schema cannot hold yet: a cost lens needs money, a fuel
 * lens needs fills, an ownership lens needs a plan or a purchase. The lens picker, the
 * time-as-pages carousel and the stat tables land with those tables.
 *
 * Refusing to draw a lens that cannot earn its headline is the same rule §D4 already
 * applies to charts — "a chart that cannot earn its headline and sentence is a stat
 * table instead", and a stat table with nothing in it is a sentence.
 */

import { useRouter } from 'expo-router';
import { Text } from 'react-native';

import { Gutter, Root, RootHeader } from '../ui/controls';
import { useKoiTheme } from '../ui/theme';

export default function InsightsScreen(): React.JSX.Element {
  const t = useKoiTheme();
  const router = useRouter();
  return (
    <Root>
      <RootHeader title="Insights" onSettings={() => router.push('/settings')} />
      <Gutter style={{ paddingTop: t.space.xxl, gap: t.space.sm }}>
        <Text style={[t.type.title, { fontSize: 19 }]}>Not enough here to measure yet.</Text>
        <Text style={t.type.soft}>
          Koi needs fills and services before it can tell you what your cars cost.
        </Text>
      </Gutter>
    </Root>
  );
}
