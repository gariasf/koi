/**
 * The in-sheet keypad — not a nicety.
 *
 * The system keyboard cannot be trusted to offer `,`, and money parsing is a 1000×
 * corruption class: under an es-ES convention `1.234,56` = `1,234.56` = 1234,56,
 * and a grouping-only `20.000` is 20000, never 20,0 (inv.20). A keypad Koi draws
 * itself is the only way to guarantee the decimal key exists and that no other
 * character can arrive.
 *
 * The decimal key is optional because not every quantity has one: an odometer
 * reading is whole kilometres, so offering `,` there would let a user type a value
 * Koi would then have to refuse. The slot stays empty rather than moving the other
 * keys — a keypad whose digits shift position between sheets is worse than a gap.
 */

import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { Pressable } from 'react-native';

import { useKoiTheme } from './theme';

const DIGITS = ['1', '2', '3', '4', '5', '6', '7', '8', '9'] as const;

export function Keypad({
  onDigit,
  onDecimal,
  onBackspace,
  decimal = true,
  decimalMark = ',',
  style,
}: {
  onDigit: (digit: string) => void;
  onDecimal?: () => void;
  onBackspace: () => void;
  decimal?: boolean;
  decimalMark?: string;
  style?: StyleProp<ViewStyle>;
}): React.JSX.Element {
  const t = useKoiTheme();

  const key = (
    label: string,
    onPress: (() => void) | null,
    tone: 'ink' | 'accent' | 'soft',
    accessibilityLabel?: string,
  ): React.JSX.Element => {
    if (onPress === null) {
      return <View key={label} style={styles.key} />;
    }
    const color = tone === 'accent' ? t.c.domainText.fuel : tone === 'soft' ? t.c.inkSoft : t.c.ink;
    return (
      <Pressable
        key={label}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? label}
        style={({ pressed }) => [
          styles.key,
          { borderRadius: t.radius.button },
          pressed && { backgroundColor: t.ctl.secondaryPress },
        ]}
      >
        <Text style={[t.type.data, { fontSize: 24, color }]}>{label}</Text>
      </Pressable>
    );
  };

  return (
    <View
      style={[
        styles.pad,
        { backgroundColor: t.c.paper, borderTopColor: t.c.hairline },
        style,
      ]}
    >
      {DIGITS.map((d) => key(d, () => onDigit(d), 'ink'))}
      {decimal && onDecimal !== undefined
        ? key(decimalMark, onDecimal, 'accent', 'decimal mark')
        : key('gap', null, 'ink')}
      {key('0', () => onDigit('0'), 'ink')}
      {key('⌫', onBackspace, 'soft', 'delete the last digit')}
    </View>
  );
}

const styles = StyleSheet.create({
  pad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 10,
    paddingTop: 10,
    paddingBottom: 26,
  },
  key: {
    width: '33.333%',
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
  },
});
