/**
 * The S-4 review queue — where every flag this architecture produces lands.
 *
 * The pattern is the import "Review now" one (§B3 / D-013): named records, the user
 * decides, nothing is repaired silently. So the list names each record, states what
 * happened, and never sorts a decision into a "warning" bucket that can be swiped
 * away. Resolved items stay visible below — a decision is part of the record, not a
 * deletion.
 *
 * Two things this screen must NOT say: **`Everything OK`** and **`Needs you`**. Those
 * two strings belong to Home's state machine, and a second surface using them would
 * let two screens make the same promise about different things (a Session 7 finding).
 *
 * **One destination, two doors** (D-057/D-058): pushed inside the Home tab from Home's
 * decision card, and inside the Settings sheet from `Review notes`. The back link
 * names whichever one you came through, which is the only honest label under per-tab
 * stacks.
 */

import { useQuery } from '@powersync/react';
import { usePathname, useRouter } from 'expo-router';
import { Text, View } from 'react-native';

import { flagSubject, type FlagWithRecord } from '../review/naming';
import { reviewKind } from '../review/kinds';
import { OPEN_REVIEW_SQL, RESOLVED_REVIEW_SQL } from '../review/queries';
import { Empty, Gutter, PageHeader, Root, Row, SectionLabel } from '../ui/controls';
import { useFormat } from '../ui/format';
import { AttentionWell, Well } from '../ui/icons';
import { useKoiTheme } from '../ui/theme';

import type { FlagRow } from '../data/flags';

type ReviewRow = FlagRow & FlagWithRecord;

export default function ReviewQueueScreen(): React.JSX.Element {
  const t = useKoiTheme();
  const f = useFormat();
  const router = useRouter();
  const pathname = usePathname();
  const inSettings = pathname.startsWith('/settings');
  const { data: open = [] } = useQuery<ReviewRow>(OPEN_REVIEW_SQL);
  const { data: resolved = [] } = useQuery<ReviewRow>(RESOLVED_REVIEW_SQL);

  const item = (flag: ReviewRow, done: boolean): React.JSX.Element => {
    const kind = reviewKind(flag.kind);
    const subject = flagSubject(flag);
    const meta = [subject.name, subject.carName, subject.absent ? 'deleted' : null]
      .filter((part): part is string => part !== null && part !== '')
      .join(' · ');
    return (
      <Row
        key={flag.id}
        well={done ? <Well kind="note" size={38} /> : <AttentionWell />}
        title={kind.title}
        meta={meta}
        metaTone={done ? 'faint' : 'soft'}
        dim={done}
        chevron="page"
        onPress={() =>
          router.push(inSettings ? `/settings/review/${flag.id}` : `/home/review/${flag.id}`)
        }
      />
    );
  };

  return (
    <Root>
      <PageHeader
        back={inSettings ? 'Settings' : 'Home'}
        onBack={() => router.back()}
        title="Review notes"
      />
      <Gutter style={{ paddingTop: t.space.lg, gap: t.space.xs }}>
        {open.length === 0 ? (
          <>
            <Text style={t.type.title}>Nothing needs a decision.</Text>
            <Empty>
              When two devices disagree, or a change cannot be applied, it waits here.
            </Empty>
          </>
        ) : (
          <>
            <Text style={t.type.title}>
              {open.length === 1
                ? 'One thing needs a decision'
                : `${f.integer(open.length)} things need a decision`}
            </Text>
            <Text style={t.type.soft}>Nothing is fixed silently. You decide what happens.</Text>
            <View style={{ paddingTop: t.space.sm }}>{open.map((flag) => item(flag, false))}</View>
          </>
        )}

        {resolved.length > 0 && (
          <View style={{ paddingTop: t.space.xl, gap: t.space.xs }}>
            <SectionLabel>Reviewed</SectionLabel>
            {resolved.map((flag) => item(flag, true))}
          </View>
        )}
      </Gutter>
    </Root>
  );
}
