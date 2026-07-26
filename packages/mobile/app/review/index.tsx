/**
 * The S-4 review queue — where every flag this architecture produces lands.
 *
 * The pattern is the import "Review now" one (§B3 / D-013): named records, the
 * user decides, nothing is repaired silently. So the list names each record,
 * states what happened, and never sorts a decision into a "warning" bucket that
 * can be swiped away. Resolved items stay visible below — a decision is part of
 * the record, not a deletion.
 */

import { useQuery } from '@powersync/react';
import { useRouter } from 'expo-router';
import { Text } from 'react-native';

import { flagSubject, type FlagWithRecord } from '../../src/review/naming';
import { reviewKind } from '../../src/review/kinds';
import { OPEN_REVIEW_SQL, RESOLVED_REVIEW_SQL } from '../../src/review/queries';
import { Card, Empty, Row, Screen, SectionLabel } from '../../src/ui/components';
import { color, type } from '../../src/ui/theme';

import type { FlagRow } from '../../src/data/flags';

type ReviewRow = FlagRow & FlagWithRecord;

export default function ReviewQueueScreen(): React.JSX.Element {
  const router = useRouter();
  const { data: open = [] } = useQuery<ReviewRow>(OPEN_REVIEW_SQL);
  const { data: resolved = [] } = useQuery<ReviewRow>(RESOLVED_REVIEW_SQL);

  const item = (flag: ReviewRow, done: boolean): React.JSX.Element => {
    const kind = reviewKind(flag.kind);
    const subject = flagSubject(flag);
    const meta = [subject.name, subject.carName, subject.absent ? 'deleted' : null]
      .filter((p): p is string => p !== null && p !== '')
      .join(' · ');
    return (
      <Card key={flag.id}>
        <Row
          title={kind.title}
          meta={meta}
          accent={done ? color.hairline : color.attention}
          onPress={() => router.push(`/review/${flag.id}`)}
        />
      </Card>
    );
  };

  return (
    <Screen>
      {open.length === 0 ? (
        <>
          <Text style={type.title}>Everything OK</Text>
          <Empty>
            Nothing needs a decision. When two devices disagree, or a change cannot be applied, it
            waits here.
          </Empty>
        </>
      ) : (
        <>
          <Text style={type.title}>
            {open.length} {open.length === 1 ? 'thing needs' : 'things need'} you
          </Text>
          <Text style={type.soft}>Nothing is fixed silently. You decide what happens.</Text>
          {open.map((flag) => item(flag, false))}
        </>
      )}

      {resolved.length > 0 && (
        <>
          <SectionLabel>Reviewed</SectionLabel>
          {resolved.map((flag) => item(flag, true))}
        </>
      )}
    </Screen>
  );
}
