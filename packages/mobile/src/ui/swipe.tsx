/**
 * A swipeable ledger row — the mechanic the design has always assumed and the
 * build never had: both gesture libraries were installed and imported nowhere.
 *
 * The action is revealed, not performed: the swipe uncovers `Delete`, the tap on it
 * deletes, and the undo lives in the app-level toast queue. That ordering is what
 * keeps a swipe from being a destructive gesture — nothing is lost by a stray
 * thumb, and nothing is lost by a second delete either (see `toast.tsx`).
 *
 * `Delete` is critical **text** on the ordinary surface. There is no red fill in
 * Koi, including behind a row.
 */

import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useKoiTheme } from './theme';

export function SwipeRow({
  children,
  onDelete,
  label = 'Delete',
}: {
  children: React.ReactNode;
  onDelete: () => void;
  label?: string;
}): React.JSX.Element {
  const t = useKoiTheme();
  return (
    <ReanimatedSwipeable
      friction={2}
      rightThreshold={40}
      enableTrackpadTwoFingerGesture
      renderRightActions={(_progress, _translation, methods) => (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={label}
          onPress={() => {
            methods.close();
            onDelete();
          }}
          style={({ pressed }) => [
            styles.action,
            { backgroundColor: pressed ? t.ctl.secondaryPress : t.c.paper },
          ]}
        >
          <Text style={[t.type.body, { color: t.c.critical }]}>{label}</Text>
        </Pressable>
      )}
    >
      {/* The swipe wrapper IS the row's card, so the inner padding belongs here:
          a Row placed straight into a gutter needs none, but one inside a card
          would otherwise print its trailing date hard against the edge. */}
      <View style={{ backgroundColor: t.c.card, paddingHorizontal: 12 }}>{children}</View>
    </ReanimatedSwipeable>
  );
}

const styles = StyleSheet.create({
  action: { minWidth: 96, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
});
