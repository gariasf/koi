/**
 * The small set of surfaces these screens need. Deliberately plain: the real
 * component language (capture sheets, fitted pickers, the one spring) is the app
 * surface build (BOARD bucket D). What IS honoured here, because they are laws
 * rather than styling:
 *
 *  - touch targets ≥ 44 pt (§D7)
 *  - one toast at a time, undo runs 6 s behind a draining hairline, and Undo /
 *    Retry are the only actions that ride in a toast (§D7)
 *  - a destructive confirmation is always typed or explicit (inv.31)
 *  - missing data is stated, never styled as an error (§D5)
 */

import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';

import { color, radius, space, type } from './theme';

export function Screen({ children }: { children: React.ReactNode }): React.JSX.Element {
  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.screenContent}
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </ScrollView>
  );
}

export function Card({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}): React.JSX.Element {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function SectionLabel({ children }: { children: string }): React.JSX.Element {
  return <Text style={[type.micro, styles.sectionLabel]}>{children.toUpperCase()}</Text>;
}

/** Missing data is a sentence, not an error (§D5). */
export function Empty({ children }: { children: string }): React.JSX.Element {
  return <Text style={[type.soft, styles.empty]}>{children}</Text>;
}

export function Row({
  title,
  meta,
  value,
  onPress,
  accent,
}: {
  title: string;
  meta?: string;
  value?: string;
  onPress?: () => void;
  accent?: string;
}): React.JSX.Element {
  const body = (
    <View style={styles.row}>
      <View style={[styles.well, { backgroundColor: accent ?? color.hairline }]} />
      <View style={styles.rowText}>
        <Text style={type.body}>{title}</Text>
        {meta !== undefined && <Text style={type.faint}>{meta}</Text>}
      </View>
      {value !== undefined && <Text style={type.data}>{value}</Text>}
    </View>
  );
  if (onPress === undefined) return body;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => (pressed ? styles.rowPressed : undefined)}
    >
      {body}
    </Pressable>
  );
}

export type ButtonTone = 'default' | 'accent' | 'critical' | 'quiet';

export function Button({
  label,
  onPress,
  tone = 'default',
  disabled,
}: {
  label: string;
  onPress: () => void;
  tone?: ButtonTone;
  disabled?: boolean;
}): React.JSX.Element {
  const tones: Record<ButtonTone, { bg: string; fg: string; border: string }> = {
    default: { bg: color.card, fg: color.ink, border: color.hairline },
    accent: { bg: color.accent, fg: '#FFFFFF', border: color.accent },
    critical: { bg: color.card, fg: color.critical, border: color.critical },
    quiet: { bg: 'transparent', fg: color.inkSoft, border: 'transparent' },
  };
  const t = tones[tone];
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled === true }}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: t.bg, borderColor: t.border },
        pressed && styles.buttonPressed,
        disabled === true && styles.buttonDisabled,
      ]}
    >
      <Text style={[type.body, { color: t.fg, fontWeight: '600' }]}>{label}</Text>
    </Pressable>
  );
}

export function Field({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'number-pad';
}): React.JSX.Element {
  return (
    <View style={styles.field}>
      <Text style={type.micro}>{label.toUpperCase()}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={color.inkFaint}
        keyboardType={keyboardType ?? 'default'}
        style={[styles.input, keyboardType === 'number-pad' ? type.data : type.body]}
        accessibilityLabel={label}
      />
    </View>
  );
}

export interface ToastState {
  readonly message: string;
  readonly action?: { readonly label: 'Undo' | 'Retry'; readonly onPress: () => void };
  readonly tone?: 'success' | 'error';
}

/**
 * One at a time; success fades after 3 s, an undo offer runs 6 s behind a
 * draining hairline, an error persists until dismissed (§D7). The surface never
 * turns red — the hairline carries the state.
 */
export function Toast({
  state,
  onDismiss,
}: {
  state: ToastState | null;
  onDismiss: () => void;
}): React.JSX.Element | null {
  const drain = useRef(new Animated.Value(1)).current;
  const [shown, setShown] = useState<ToastState | null>(state);

  // onDismiss is a fresh closure every render at every call site (`() =>
  // setToast(null)` inline in JSX) — a live query firing elsewhere on the screen
  // re-renders the parent constantly, so if the effect depended on it directly
  // it would restart the timer on renders that have nothing to do with this
  // toast, breaking the §D7 promise (3 s / 6 s, not "3 s since whatever last
  // re-rendered the screen"). The ref reads the latest closure without being a
  // dependency; `state` itself is referentially stable across re-renders that
  // don't call setToast, so it alone is the right trigger.
  const onDismissRef = useRef(onDismiss);
  onDismissRef.current = onDismiss;

  useEffect(() => {
    setShown(state);
    if (state === null) return;
    const persists = state.tone === 'error';
    const ms = state.action !== undefined ? 6000 : 3000;
    drain.setValue(1);
    if (persists) return;
    const animation = Animated.timing(drain, {
      toValue: 0,
      duration: ms,
      useNativeDriver: false,
    });
    animation.start();
    const timer = setTimeout(() => onDismissRef.current(), ms);
    return () => {
      animation.stop();
      clearTimeout(timer);
    };
  }, [state, drain]);

  if (shown === null) return null;
  const hairline = shown.tone === 'error' ? color.critical : color.accent;

  return (
    <View style={styles.toast} accessibilityLiveRegion="polite">
      <View style={styles.toastBody}>
        <Text style={[type.body, styles.toastText]} numberOfLines={2}>
          {shown.message}
        </Text>
        {shown.action !== undefined && (
          <Pressable
            onPress={() => {
              shown.action?.onPress();
              onDismiss();
            }}
            accessibilityRole="button"
            style={styles.toastAction}
          >
            <Text style={[type.body, { color: color.accent, fontWeight: '600' }]}>
              {shown.action.label}
            </Text>
          </Pressable>
        )}
        {shown.action === undefined && shown.tone === 'error' && (
          <Pressable onPress={onDismiss} accessibilityRole="button" style={styles.toastAction}>
            <Text style={[type.body, { color: color.inkSoft }]}>Close</Text>
          </Pressable>
        )}
      </View>
      <Animated.View
        style={[
          styles.toastHairline,
          {
            backgroundColor: hairline,
            width: drain.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
          },
        ]}
      />
    </View>
  );
}

/** Explicit confirmation for anything destructive (inv.31). */
export function ConfirmPanel({
  title,
  body,
  confirmLabel,
  onConfirm,
  onCancel,
}: {
  title: string;
  body: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}): React.JSX.Element {
  return (
    <Card style={styles.confirm}>
      <Text style={type.title}>{title}</Text>
      <Text style={[type.soft, { marginTop: space.xs }]}>{body}</Text>
      <View style={styles.confirmActions}>
        <Button label="Keep it" tone="quiet" onPress={onCancel} />
        <Button label={confirmLabel} tone="critical" onPress={onConfirm} />
      </View>
    </Card>
  );
}

export function KeyValue({ label, value }: { label: string; value: string }): React.JSX.Element {
  return (
    <View style={styles.keyValue}>
      <Text style={[type.faint, styles.keyValueKey]}>{label}</Text>
      <Text style={[type.data, styles.keyValueValue]} selectable>
        {value}
      </Text>
    </View>
  );
}

export const textStyles: Record<string, StyleProp<TextStyle>> = {
  title: type.title,
  body: type.body,
  soft: type.soft,
  faint: type.faint,
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.paper },
  screenContent: { padding: space.lg, paddingBottom: space.xxl * 3, gap: space.md },
  card: {
    backgroundColor: color.card,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: color.hairline,
    padding: space.md,
    gap: space.sm,
  },
  sectionLabel: { marginTop: space.md },
  empty: { paddingVertical: space.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, minHeight: 44 },
  rowPressed: { opacity: 0.6 },
  rowText: { flex: 1, gap: 2 },
  well: { width: 6, height: 28, borderRadius: 3 },
  button: {
    minHeight: 44,
    paddingHorizontal: space.lg,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: radius.sm,
    borderWidth: StyleSheet.hairlineWidth,
  },
  buttonPressed: { opacity: 0.6 },
  buttonDisabled: { opacity: 0.35 },
  field: { gap: space.xs },
  input: {
    minHeight: 44,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: color.hairline,
    borderRadius: radius.sm,
    paddingHorizontal: space.md,
    backgroundColor: color.card,
    color: color.ink,
  },
  toast: {
    position: 'absolute',
    left: space.lg,
    right: space.lg,
    bottom: space.xl,
    backgroundColor: color.card,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: color.hairline,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  toastBody: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: space.md,
    gap: space.md,
    minHeight: 44,
  },
  toastText: { flex: 1 },
  toastAction: { minHeight: 44, justifyContent: 'center', paddingHorizontal: space.sm },
  toastHairline: { height: 2 },
  confirm: { borderColor: color.critical },
  confirmActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: space.sm,
    marginTop: space.sm,
  },
  keyValue: { flexDirection: 'row', gap: space.md, alignItems: 'flex-start' },
  keyValueKey: { width: 118 },
  keyValueValue: { flex: 1 },
});
