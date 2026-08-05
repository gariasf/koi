/**
 * Home (sheet 05) — "does anything need me?", answered in three seconds. Never a
 * dashboard, never a chart.
 *
 * **Strict precedence: exactly one state renders.**
 *
 *  1. `Needs you` — a reminder is overdue (+ the decision band when flags are open)
 *  2. `Needs you` — nothing overdue **and** ≥1 open review item
 *  3. `Coming up` — something due within 28 days, nothing overdue, no open flags
 *  4. `All clear` — nothing overdue, nothing within 28 days, **zero** open flags
 *
 * A reminder outranks a flag because an overdue ITV has a date in the real world and
 * a data disagreement does not; it waits. And `All clear` requires zero open flags
 * (D-057) — this screen is Koi's promise, and it must not be able to say "Everything
 * OK" while two devices disagree in a drawer.
 *
 * States 1 and 3 need the reminders table, which is not built: with no reminders in
 * the schema, nothing can be overdue and nothing can be due within 28 days, so the
 * machine correctly selects between 2 and 4. The precedence is written out in full
 * anyway, because the order is the design and adding a row to it later must not be a
 * rewrite.
 *
 * **The month pulse** is three numbers and no chart, ever (article 2). Only one of
 * the three is a number this schema can honestly produce: distance comes from the
 * trail, while money has no records to sum. So money and €/km are **withheld** —
 * *Not applicable does not render at all*, and a `0,00 €` here would claim a real sum
 * of zero records when the truth is that Koi cannot yet be told about a euro
 * (annex A's three renderings). Distance uses the strict km rule: the newest reading
 * inside the month minus the last reading at or before its start.
 *
 * The `LAST FILL` card is absent for the same reason, not by oversight: its five data
 * situations are all about a fuel record, and its own empty state (*No fills yet. Log
 * one and Koi starts measuring.*) would be an instruction the app cannot honour.
 */

import { useQuery } from '@powersync/react';
import { useRouter } from 'expo-router';
import { Text, View } from 'react-native';

import { todayCivil } from '../clock';
import { OPEN_FLAG_COUNT_SQL } from '../data/flags';
import { MONTH_ENDS_SQL, monthDistanceKm, monthEndsParams, type CarMonthEnds } from '../data/pulse';
import {
  BrandMark,
  Button,
  Card,
  Fab,
  Gutter,
  LabelledRule,
  Root,
  RootHeader,
  Row,
} from '../ui/controls';
import { useFormat } from '../ui/format';
import { AttentionDot, AttentionWell } from '../ui/icons';
import { useKoiTheme } from '../ui/theme';

/** The month the pulse covers: this calendar month, all live cars, no scope control. */
function monthWindow(today: string): { start: string; end: string; label: string } {
  const start = `${today.slice(0, 7)}-01`;
  return { start, end: today, label: today };
}

export default function HomeScreen(): React.JSX.Element {
  const t = useKoiTheme();
  const f = useFormat();
  const router = useRouter();
  const today = todayCivil();
  const month = monthWindow(today);

  const { data: flagCounts = [] } = useQuery<{ n: number }>(OPEN_FLAG_COUNT_SQL);
  const openFlags = flagCounts[0]?.n ?? 0;
  const { data: carCounts = [] } = useQuery<{ n: number }>(
    `SELECT count(*) AS n FROM cars WHERE archived_at IS NULL`,
  );
  const liveCars = carCounts[0]?.n ?? 0;
  const { data: ends = [] } = useQuery<CarMonthEnds>(
    MONTH_ENDS_SQL,
    monthEndsParams(month.start, month.end),
  );
  const distance = monthDistanceKm(ends);

  return (
    <View style={{ flex: 1, backgroundColor: t.c.paper }}>
      <Root>
        <RootHeader title="Home" onSettings={() => router.push('/settings')} />

        {liveCars === 0 ? (
          <ZeroCars openFlags={openFlags} />
        ) : openFlags > 0 ? (
          <NeedsYou count={openFlags} />
        ) : (
          <AllClear />
        )}

        {liveCars > 0 && (
          <Gutter style={{ paddingTop: t.space.xl + 2, gap: t.space.sm }}>
            <LabelledRule>{f.monthLabel(month.start)}</LabelledRule>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              {distance === null ? (
                <Text style={[t.type.data, { fontSize: 17, color: t.c.inkFaint }]}>—</Text>
              ) : (
                <Text style={[t.type.data, { fontSize: 17 }]}>{f.km(distance)}</Text>
              )}
            </View>
            {distance === null && <Text style={t.type.soft}>No readings this month.</Text>}
          </Gutter>
        )}
      </Root>
      <Fab onPress={() => router.push(liveCars === 0 ? '/car-form' : '/capture/odometer')} />
    </View>
  );
}

/**
 * State 2. **No Snooze, no Mark done**: a flag is not a reminder and cannot be
 * deferred to a date — the only honest action is to go look. At a count of one the
 * card would collapse to that item's own sentence, which is more use than a number;
 * the queue page carries those sentences today, so the card keeps the count and the
 * sentence that is true either way.
 */
function NeedsYou({ count }: { count: number }): React.JSX.Element {
  const t = useKoiTheme();
  const f = useFormat();
  const router = useRouter();
  return (
    <Gutter style={{ paddingTop: t.space.xl, gap: t.space.sm }}>
      <Text style={[t.type.micro, { color: t.c.attention }]}>Needs you</Text>
      <Card>
        <Row
          well={<AttentionWell />}
          title={
            count === 1 ? 'One thing needs a decision' : `${f.integer(count)} things need a decision`
          }
        />
        <Text style={t.type.soft}>Nothing is fixed silently.</Text>
        <Button
          label="Review"
          variant="primary"
          onPress={() => router.push('/home/review')}
          style={{ alignSelf: 'flex-start', marginTop: t.space.sm, paddingHorizontal: 26 }}
        />
      </Card>
    </Gutter>
  );
}

/** State 4 — the brand moment. Both strings verbatim, and no relief performed. */
function AllClear(): React.JSX.Element {
  const t = useKoiTheme();
  return (
    <Gutter style={{ paddingTop: 76, alignItems: 'center' }}>
      <BrandMark />
      <Text style={[t.type.display, { marginTop: 30, textAlign: 'center' }]}>Everything OK</Text>
      <Text style={[t.type.body, { color: t.c.inkSoft, marginTop: 4 }]}>
        All quiet for the next few weeks.
      </Text>
    </Gutter>
  );
}

/**
 * Zero cars wins the screen — but "no cars" and "nothing to review" are independent
 * facts, and a flag can outlive the car it was about (that is exactly what a
 * `late-child` flag is). So Home alone keeps a quiet review row beneath the hero,
 * rather than the other way round: with no live car the queue's real action has
 * nowhere honest to put a record.
 */
function ZeroCars({ openFlags }: { openFlags: number }): React.JSX.Element {
  const t = useKoiTheme();
  const f = useFormat();
  const router = useRouter();
  return (
    <Gutter style={{ paddingTop: 76, alignItems: 'center', gap: t.space.md }}>
      <BrandMark size={62} />
      <Text style={[t.type.title, { fontSize: 20, marginTop: t.space.md }]}>
        Add your car to begin.
      </Text>
      <Button
        label="Add a car"
        variant="primary"
        onPress={() => router.push('/car-form')}
        style={{ marginTop: t.space.sm, paddingHorizontal: 30 }}
      />
      {openFlags > 0 && (
        <View
          style={{
            alignSelf: 'stretch',
            marginTop: t.space.xl,
            borderTopWidth: 1,
            borderTopColor: t.c.hairline,
          }}
        >
          <Row
            well={<AttentionDot />}
            title={`Review notes · ${f.integer(openFlags)}`}
            chevron="page"
            onPress={() => router.push('/home/review')}
          />
        </View>
      )}
    </Gutter>
  );
}
