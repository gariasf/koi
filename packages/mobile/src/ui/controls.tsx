/**
 * The Koi control language (design sheet 02) — one list, because a second
 * implementation of any row is how two surfaces start disagreeing.
 *
 * If a screen needs something that is not in here, that is a finding about the
 * screen, not a licence to draw a new control.
 *
 * The laws these components encode, rather than merely style:
 *
 *  - **Emphasis is ink.** `primary` is the darkest object on the surface. The accent
 *    (`domainText.fuel`) is reserved for tinted interactive *type* — back links,
 *    `Discard`, toast `Undo`, picker checkmarks — which reads as tappable without
 *    competing for weight, and inverts correctly in dark (§B1, sheet 08 §G1).
 *  - **Nothing turns red** but a destructive confirmation and a hard validation
 *    error, and even then only as *text* on the ordinary surface — never a fill,
 *    never a banner (§D5).
 *  - **A degraded row is still a row.** No dimming, no warning tint, no apology:
 *    if a state is drawn to look broken, users treat their own honest data as a
 *    mistake they made (annex A).
 *  - **≥44 pt targets everywhere**, ghost buttons included, and rows are real
 *    buttons. Decorative glyphs are hidden from the screen reader.
 *  - **Micro-labels are authored in sentence case** and uppercased by `type.micro`.
 */

import { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Car, Check, ChevronRight, Plus, Settings as SettingsGlyph, STROKE } from './icons';
import { useKoiTheme } from './theme';

/* ─── surfaces ────────────────────────────────────────────────────────────── */

/**
 * A root screen or a pushed page.
 *
 * The top inset is the notch, and it is the screen's job rather than each header's:
 * a title that starts under the status bar is the first thing a reviewer sees and the
 * last thing anyone remembers to fix. The bottom inset clears the tab bar and the FAB,
 * so content can always scroll out from under both instead of living beneath them.
 */
export function Root({
  children,
  scroll = true,
}: {
  children: React.ReactNode;
  scroll?: boolean;
}): React.JSX.Element {
  const t = useKoiTheme();
  const insets = useSafeAreaInsets();
  const body = {
    paddingTop: insets.top,
    paddingBottom: t.fab.size + t.space.xxl * 2,
  };
  if (!scroll) {
    return <View style={[{ flex: 1, backgroundColor: t.c.paper }, body]}>{children}</View>;
  }
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: t.c.paper }}
      contentContainerStyle={body}
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </ScrollView>
  );
}

/** The 20 pt screen gutter. Section blocks own their own vertical rhythm. */
export function Gutter({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}): React.JSX.Element {
  const t = useKoiTheme();
  return <View style={[{ paddingHorizontal: t.gutter }, style]}>{children}</View>;
}

/**
 * A root header: the page title, and the floating Settings button that sits on
 * every root. Settings is not a tab and not a row inside Garage (sheet 03 §01).
 */
export function RootHeader({
  title,
  onSettings,
}: {
  title: string;
  onSettings?: () => void;
}): React.JSX.Element {
  const t = useKoiTheme();
  return (
    <View style={[styles.rootHeader, { paddingHorizontal: t.gutter }]}>
      <Text style={t.type.pageTitle} accessibilityRole="header">
        {title}
      </Text>
      {onSettings !== undefined && (
        <Pressable
          onPress={onSettings}
          accessibilityRole="button"
          accessibilityLabel="Settings"
          hitSlop={8}
          style={({ pressed }) => [
            styles.settingsButton,
            {
              backgroundColor: pressed ? t.ctl.secondaryPress : t.c.card,
              borderColor: t.c.hairline,
            },
          ]}
        >
          <SettingsGlyph size={17} color={t.c.inkSoft} strokeWidth={STROKE} />
        </Pressable>
      )}
    </View>
  );
}

/**
 * A pushed page's header: `‹ {where you came from}` · title · an optional action.
 *
 * The back link names the *tab* you came from, which is the only honest label under
 * per-tab stacks — and it is tinted type, the accent's one non-fuel job. The page
 * pops by path mutation (`router.back()`); it never dismisses itself.
 */
export function PageHeader({
  back,
  onBack,
  title,
  action,
}: {
  back: string;
  onBack: () => void;
  title: string;
  action?: React.ReactNode;
}): React.JSX.Element {
  const t = useKoiTheme();
  return (
    <View
      style={[
        styles.pageHeader,
        { paddingHorizontal: t.gutter, borderBottomColor: t.c.hairline },
      ]}
    >
      <Pressable onPress={onBack} accessibilityRole="button" hitSlop={8} style={styles.flex}>
        <Text style={[t.type.link, { fontSize: 15.5 }]}>‹ {back}</Text>
      </Pressable>
      <Text style={[t.type.title, { fontSize: 16 }]} accessibilityRole="header">
        {title}
      </Text>
      <View style={[styles.flex, styles.pageHeaderAction]}>{action}</View>
    </View>
  );
}

export function Card({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}): React.JSX.Element {
  const t = useKoiTheme();
  return (
    <View
      style={[
        {
          backgroundColor: t.c.card,
          borderRadius: t.radius.card,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: t.c.hairline,
          padding: t.space.lg,
          gap: t.space.sm,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

/** A section label. Pass sentence case — `type.micro` does the uppercasing. */
export function SectionLabel({
  children,
  tone = 'faint',
}: {
  children: string;
  tone?: 'faint' | 'attention';
}): React.JSX.Element {
  const t = useKoiTheme();
  return (
    <Text style={[t.type.micro, tone === 'attention' && { color: t.c.attention }]}>{children}</Text>
  );
}

/** Missing data is a sentence, never an error and never a bare dash (§D5). */
export function Empty({ children }: { children: string }): React.JSX.Element {
  const t = useKoiTheme();
  return <Text style={[t.type.body, { paddingVertical: t.space.sm }]}>{children}</Text>;
}

export function Rule({ style }: { style?: StyleProp<ViewStyle> }): React.JSX.Element {
  const t = useKoiTheme();
  return <View style={[{ height: 1, backgroundColor: t.c.hairline }, style]} />;
}

/** A period divider: two rules with a label between them (Home's month pulse). */
export function LabelledRule({ children }: { children: string }): React.JSX.Element {
  const t = useKoiTheme();
  return (
    <View style={styles.labelledRule}>
      <Rule style={styles.flex} />
      <Text style={[t.type.micro, styles.labelledRuleText]}>{children}</Text>
      <Rule style={styles.flex} />
    </View>
  );
}

/* ─── rows ────────────────────────────────────────────────────────────────── */

/**
 * The Row: well · title · one-line meta · trailing mono value · date.
 *
 * The well is the whole colour job — the amount stays ink, because the well has
 * already said what kind of money it is. The meta leads with a derived value **and
 * its interval**, never a bare number.
 *
 * `chevron` distinguishes the two navigations, and the distinction is load-bearing:
 * `page` (a bare ›) pushes, `sheet` (…›) opens a task sheet. Without it a row that
 * opens a task is indistinguishable from one that goes somewhere, and the user
 * cannot predict whether Back or Cancel is coming.
 */
export function Row({
  well,
  title,
  titleMono,
  meta,
  metaTone,
  value,
  date,
  chevron,
  onPress,
  trailing,
  dim,
}: {
  well?: React.ReactNode;
  title: string;
  titleMono?: boolean;
  meta?: string;
  metaTone?: 'soft' | 'attention' | 'faint';
  value?: string;
  date?: string;
  chevron?: 'page' | 'sheet';
  onPress?: () => void;
  trailing?: React.ReactNode;
  /** Archived rows only: shelved, not broken (sheet 04 §01). */
  dim?: boolean;
}): React.JSX.Element {
  const t = useKoiTheme();
  const metaColor =
    metaTone === 'attention' ? t.c.attention : metaTone === 'faint' ? t.c.inkFaint : t.c.inkSoft;
  const body = (
    <View style={[styles.row, { gap: t.space.md }]}>
      {well}
      <View style={styles.rowText}>
        <Text
          style={[
            titleMono === true ? t.type.data : t.type.body,
            { fontSize: 15.5 },
            dim === true && { color: t.c.inkSoft },
          ]}
        >
          {title}
        </Text>
        {meta !== undefined && (
          <Text style={[t.type.dataSoft, { color: metaColor }]}>{meta}</Text>
        )}
      </View>
      {trailing}
      {(value !== undefined || date !== undefined) && (
        <View style={styles.rowTrailing}>
          {value !== undefined && <Text style={t.type.data}>{value}</Text>}
          {date !== undefined && <Text style={t.type.dataFaint}>{date}</Text>}
        </View>
      )}
      {chevron !== undefined && (
        <Text
          style={[
            t.type.body,
            { color: chevron === 'sheet' ? t.c.domainText.fuel : t.c.inkFaint },
          ]}
        >
          {chevron === 'sheet' ? '…›' : '›'}
        </Text>
      )}
    </View>
  );
  if (onPress === undefined) return body;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => (pressed ? styles.pressed : undefined)}
    >
      {body}
    </Pressable>
  );
}

/**
 * A label/value fact. The label column is **not** a fixed width: at the largest
 * dynamic-type sizes the pair stacks (§H4). The build's old 118 pt cap truncated
 * exactly where reflow was required.
 */
export function FactRow({
  label,
  value,
  valueTone = 'ink',
  last,
}: {
  label: string;
  value: string;
  valueTone?: 'ink' | 'faint';
  last?: boolean;
}): React.JSX.Element {
  const t = useKoiTheme();
  return (
    <View
      style={[
        styles.factRow,
        t.stacked && styles.factRowStacked,
        { paddingVertical: t.space.sm },
        last !== true && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: t.c.hairline },
      ]}
    >
      <Text style={[t.type.body, { color: t.c.inkSoft }]}>{label}</Text>
      <Text
        style={[t.type.data, valueTone === 'faint' && { color: t.c.inkFaint }]}
        selectable
      >
        {value}
      </Text>
    </View>
  );
}

/** The stat table (sheet 02 §07): vertical always, label soft, value mono ink. */
export function StatTable({
  label,
  period,
  rows,
}: {
  label: string;
  period?: string;
  rows: readonly { readonly label: string; readonly value: string }[];
}): React.JSX.Element {
  const t = useKoiTheme();
  return (
    <View style={{ gap: t.space.sm }}>
      <View style={styles.statHead}>
        <SectionLabel>{label}</SectionLabel>
        {period !== undefined && <SectionLabel>{period}</SectionLabel>}
      </View>
      <View>
        {rows.map((r, i) => (
          <FactRow key={r.label} label={r.label} value={r.value} last={i === rows.length - 1} />
        ))}
      </View>
    </View>
  );
}

/* ─── chips ───────────────────────────────────────────────────────────────── */

/**
 * Three chip species that must never be confused.
 *
 *  - `filter` — selected fills with **ink**. "All" is a chip, not a clear button.
 *  - `option` — selected takes the ink hairline plus a real check glyph. This was
 *    the one place the accent filled a shape for a non-fuel reason, which on the
 *    *fuel* sheet put a green `Petrol` chip beside a green fuel well meaning two
 *    different things (sheet 08 §G4).
 *  - `status` — **not tappable at all.** A tappable status chip is hidden
 *    navigation with no back story. Facts, not warnings — and over-cap wears
 *    attention, never red.
 */
export function Chip({
  label,
  species,
  selected,
  tint,
  mono,
  onPress,
  trailing,
}: {
  label: string;
  species: 'filter' | 'option' | 'status';
  selected?: boolean;
  /** `status` only: which fact the chip states. */
  tint?: 'ink' | 'contract' | 'attention';
  mono?: boolean;
  onPress?: () => void;
  /** A `▾` on a chip that opens a fitted pick. */
  trailing?: string;
}): React.JSX.Element {
  const t = useKoiTheme();
  const on = selected === true;
  const look = ((): { bg: string; fg: string; border: string } => {
    if (species === 'status') {
      const key = tint ?? 'ink';
      return {
        bg: t.c.domainWash[key],
        fg: t.c.domainText[key],
        border: 'transparent',
      };
    }
    if (species === 'filter') {
      return on
        ? { bg: t.ctl.primaryBg, fg: t.ctl.primaryFg, border: t.ctl.primaryBg }
        : { bg: 'transparent', fg: t.c.ink, border: t.c.hairline };
    }
    return on
      ? { bg: t.ctl.chipSelBg, fg: t.c.ink, border: t.ctl.chipSelBorder }
      : { bg: 'transparent', fg: t.c.ink, border: t.c.hairline };
  })();

  const content = (
    <View style={styles.chipInner}>
      <Text
        style={[
          mono === true ? t.type.data : t.type.body,
          { fontSize: species === 'status' ? 13.5 : 14, color: look.fg },
        ]}
      >
        {label}
      </Text>
      {species === 'option' && on && <Check size={14} color={t.c.ink} strokeWidth={STROKE} />}
      {trailing !== undefined && (
        <Text style={[t.type.body, { fontSize: 13, color: t.c.inkSoft }]}>{trailing}</Text>
      )}
    </View>
  );

  const chip = (pressed: boolean): StyleProp<ViewStyle> => [
    styles.chip,
    {
      backgroundColor: look.bg,
      borderColor: look.border,
      borderRadius: t.radius.chip,
      borderWidth: look.border === 'transparent' ? 0 : StyleSheet.hairlineWidth,
    },
    pressed && styles.pressed,
  ];

  if (species === 'status' || onPress === undefined) {
    return <View style={chip(false)}>{content}</View>;
  }
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: on }}
      hitSlop={6}
      style={({ pressed }) => chip(pressed)}
    >
      {content}
    </Pressable>
  );
}

export function ChipRow({ children }: { children: React.ReactNode }): React.JSX.Element {
  const t = useKoiTheme();
  return <View style={[styles.chipRow, { gap: t.space.xs + 2 }]}>{children}</View>;
}

/* ─── buttons ─────────────────────────────────────────────────────────────── */

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive';

/**
 * One primary per surface, and it is ink — 15,29:1 against the paper it carries,
 * where the old accent fill was 4,10:1. Destructive is critical *text* on the
 * ordinary surface; there is no red fill anywhere in Koi.
 */
export function Button({
  label,
  onPress,
  variant = 'secondary',
  disabled,
  pill,
  compact,
  style,
}: {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  /**
   * The `Full history ›` / `All ›` / `Restore` shape: a bordered pill, not a block.
   * A ghost pill takes the hairline border — that combination (tinted type inside a
   * quiet outline) is how all three of those read in the design.
   */
  pill?: boolean;
  /**
   * Visually smaller, with the same **44 pt target** underneath: the pills in the
   * design sit around 30 pt, so the shortfall is made up in `hitSlop` rather than by
   * shipping a control the law says is too small to hit.
   */
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
}): React.JSX.Element {
  const t = useKoiTheme();
  const off = disabled === true;
  const looks: Record<ButtonVariant, { bg: string; press: string; fg: string; border: string }> = {
    primary: {
      bg: t.ctl.primaryBg,
      press: t.ctl.primaryPress,
      fg: t.ctl.primaryFg,
      border: t.ctl.primaryBg,
    },
    secondary: {
      bg: t.ctl.secondaryBg,
      press: t.ctl.secondaryPress,
      fg: t.c.ink,
      border: t.c.hairline,
    },
    ghost: {
      bg: 'transparent',
      press: t.ctl.ghostPress,
      fg: t.c.domainText.fuel,
      border: 'transparent',
    },
    destructive: {
      bg: 'transparent',
      press: t.ctl.secondaryPress,
      fg: t.c.critical,
      border: t.c.critical,
    },
  };
  const base = looks[variant];
  const border =
    pill === true && variant === 'ghost' && !off ? t.c.hairline : base.border;
  const look = off
    ? { ...base, fg: t.c.inkFaint, border: t.c.hairline, bg: 'transparent' }
    : { ...base, border };
  return (
    <Pressable
      onPress={onPress}
      disabled={off}
      accessibilityRole="button"
      accessibilityState={{ disabled: off }}
      hitSlop={compact === true ? 8 : 0}
      style={({ pressed }) => [
        styles.button,
        compact === true && styles.buttonCompact,
        {
          backgroundColor: pressed ? look.press : look.bg,
          borderColor: look.border,
          borderRadius: pill === true ? t.radius.chip : t.radius.button,
          borderWidth: look.border === 'transparent' ? 0 : StyleSheet.hairlineWidth,
          paddingHorizontal: pill === true ? t.space.lg : t.space.lg,
        },
        style,
      ]}
    >
      <Text
        style={[
          t.type.body,
          compact === true && { fontSize: 13.5 },
          { color: look.fg, fontWeight: variant === 'primary' ? '500' : '400' },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

/**
 * The FAB: an ink squircle, 52 pt, with a **neutral** shadow. Ink because `+`
 * creates *any* record — a green FAB promises a fuel fill and opens a chooser
 * whose tiles are mostly not fuel. Neutral because a coloured shadow is a glow,
 * and §D7 has none (sheet 08 §G3).
 */
export function Fab({ onPress }: { onPress: () => void }): React.JSX.Element {
  const t = useKoiTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Add a record"
      style={({ pressed }) => [
        styles.fab,
        {
          width: t.fab.size,
          height: t.fab.size,
          borderRadius: t.fab.radius,
          backgroundColor: pressed ? t.ctl.primaryPress : t.ctl.primaryBg,
          shadowColor: t.fab.shadow.color,
          shadowOpacity: t.scheme === 'dark' ? 0 : t.fab.shadow.opacity,
          shadowRadius: t.fab.shadow.radius,
          shadowOffset: t.fab.shadow.offset,
        },
      ]}
    >
      <Plus size={27} color={t.ctl.primaryFg} strokeWidth={STROKE} />
    </Pressable>
  );
}

/* ─── fields ──────────────────────────────────────────────────────────────── */

export function Field({
  label,
  value,
  onChangeText,
  placeholder,
  mono,
  suffix,
  autoCapitalize,
  keyboardType,
  multiline,
  error,
}: {
  label?: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  mono?: boolean;
  suffix?: string;
  autoCapitalize?: 'none' | 'words' | 'characters';
  keyboardType?: 'default' | 'number-pad';
  multiline?: boolean;
  /** A hard validation error: critical border + critical text, no red surface. */
  error?: boolean;
}): React.JSX.Element {
  const t = useKoiTheme();
  return (
    <View style={{ gap: t.space.xs + 2 }}>
      {label !== undefined && <SectionLabel>{label}</SectionLabel>}
      <View
        style={[
          styles.field,
          {
            borderColor: error === true ? t.c.critical : t.c.hairline,
            borderWidth: error === true ? 1.5 : StyleSheet.hairlineWidth,
            borderRadius: t.radius.field,
            backgroundColor: t.c.paper,
          },
        ]}
      >
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={t.c.inkFaint}
          autoCapitalize={autoCapitalize ?? 'sentences'}
          keyboardType={keyboardType ?? 'default'}
          multiline={multiline}
          accessibilityLabel={label}
          style={[mono === true ? t.type.data : t.type.body, styles.fieldInput]}
        />
        {suffix !== undefined && <Text style={[t.type.data, { color: t.c.inkFaint }]}>{suffix}</Text>}
      </View>
    </View>
  );
}

/**
 * A read-only value box — the capture surfaces' odometer well and derived pills.
 * `state` carries which of the five odometer situations is on screen; each one is
 * a *sentence* under the box, never a styled error (sheet 07 §02).
 */
export function ValueBox({
  value,
  suffix,
  placeholder,
  onPress,
  error,
  entered,
}: {
  value: string;
  suffix?: string;
  placeholder?: string;
  onPress?: () => void;
  error?: boolean;
  /** A value the user typed, as opposed to one Koi computed. Ink hairline. */
  entered?: boolean;
}): React.JSX.Element {
  const t = useKoiTheme();
  const empty = value === '';
  const box = (pressed: boolean): StyleProp<ViewStyle> => [
    styles.field,
    {
      borderRadius: t.radius.field,
      backgroundColor: pressed ? t.ctl.secondaryPress : t.c.card,
      borderColor:
        error === true ? t.c.critical : entered === true ? t.ctl.chipSelBorder : t.c.hairline,
      borderWidth: error === true || entered === true ? 1.5 : StyleSheet.hairlineWidth,
    },
  ];
  const content = (
    <>
      <Text style={[t.type.data, styles.valueBoxText, empty && { color: t.c.inkFaint }]}>
        {empty ? (placeholder ?? '') : value}
      </Text>
      {suffix !== undefined && <Text style={[t.type.data, { color: t.c.inkFaint }]}>{suffix}</Text>}
    </>
  );
  if (onPress === undefined) return <View style={box(false)}>{content}</View>;
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={({ pressed }) => box(pressed)}>
      {content}
    </Pressable>
  );
}

/* ─── gauge ───────────────────────────────────────────────────────────────── */

/**
 * Fill + track + a sentence. The denominator is the **pooled** budget wherever
 * pooling is active, and the Garage chip uses the same one: a gauge drawn against
 * the bare cap would call a car over while the chip called it under, which is the
 * disagreement §C4 forbids (§B4, decisions §H N1).
 *
 * Over-cap fills `attention`, the overage is counted in text, and the pace line
 * stays present tense. Never hidden, never red, nothing flashes.
 */
export function Gauge({
  used,
  budget,
  format,
  period,
  basis,
  verdict,
}: {
  used: number;
  /** The pooled budget when pooling is active — one denominator, both surfaces. */
  budget: number;
  format: (value: number) => string;
  period: string;
  basis: string;
  verdict: { over: boolean; text: string };
}): React.JSX.Element {
  const t = useKoiTheme();
  const ratio = budget > 0 ? Math.min(1, Math.max(0, used / budget)) : 0;
  return (
    <Card style={{ gap: t.space.md }}>
      <View style={styles.statHead}>
        <Text style={[t.type.data, { fontSize: 19 }]}>
          {format(used)} / {format(budget)}
        </Text>
        <SectionLabel>{period}</SectionLabel>
      </View>
      <View style={[styles.gaugeTrack, { backgroundColor: t.c.hairline }]}>
        <View
          style={[
            styles.gaugeFill,
            {
              width: `${Math.round(ratio * 1000) / 10}%` as `${number}%`,
              backgroundColor: verdict.over ? t.c.attention : t.c.ink,
            },
          ]}
        />
      </View>
      <Text style={t.type.soft}>
        {basis}{' '}
        <Text style={{ color: verdict.over ? t.c.attention : t.c.ink }}>{verdict.text}</Text>
      </Text>
    </Card>
  );
}

/* ─── confirmations ───────────────────────────────────────────────────────── */

/**
 * A destructive confirmation. Where it must be typed, it demands **the thing's own
 * name** rather than a generic word — "demands its name understood". Confirm stays
 * disabled until it matches, and a wrong entry *says so* rather than silently
 * doing nothing, which is what the build did before.
 */
export function Confirm({
  visible,
  title,
  body,
  confirmLabel,
  typedPhrase,
  onConfirm,
  onCancel,
  cancelLabel = 'Cancel',
}: {
  visible: boolean;
  title: string;
  body: readonly string[];
  confirmLabel: string;
  /** When set, the exact string the user must type to enable the confirm. */
  typedPhrase?: string;
  onConfirm: () => void;
  onCancel: () => void;
  cancelLabel?: string;
}): React.JSX.Element {
  const t = useKoiTheme();
  const [typed, setTyped] = useState('');
  const [mismatch, setMismatch] = useState(false);
  const needsTyping = typedPhrase !== undefined;
  const matches = !needsTyping || typed.trim() === typedPhrase;

  const close = (): void => {
    setTyped('');
    setMismatch(false);
    onCancel();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={close}>
      <View style={[styles.scrim, { backgroundColor: t.scheme === 'dark' ? '#000000AA' : '#1C1A1755' }]}>
        <View
          style={[
            styles.confirmCard,
            {
              backgroundColor: t.c.sheet,
              borderRadius: t.radius.card,
              borderWidth: StyleSheet.hairlineWidth,
              borderColor: t.c.hairline,
            },
          ]}
        >
          <Text style={[t.type.title, { fontSize: 17 }]} accessibilityRole="header">
            {title}
          </Text>
          {body.map((line) => (
            <Text key={line} style={t.type.soft}>
              {line}
            </Text>
          ))}
          {needsTyping && (
            <>
              <Field
                value={typed}
                onChangeText={(v) => {
                  setTyped(v);
                  setMismatch(false);
                }}
                placeholder={`Type ${typedPhrase} to confirm`}
                autoCapitalize="none"
                mono
              />
              {mismatch && (
                <Text style={[t.type.soft, { color: t.c.critical }]}>
                  That is not {typedPhrase}.
                </Text>
              )}
            </>
          )}
          <View style={[styles.confirmActions, { gap: t.space.sm }]}>
            <Button label={cancelLabel} onPress={close} style={styles.flex} />
            <Button
              label={confirmLabel}
              variant="destructive"
              disabled={needsTyping && !matches}
              onPress={() => {
                if (!matches) {
                  setMismatch(true);
                  return;
                }
                setTyped('');
                onConfirm();
              }}
              style={styles.flex}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

/* ─── fitted pick ─────────────────────────────────────────────────────────── */

/**
 * The bottom of the depth ladder: **applies on tap, closes itself, no Save button.**
 * The parent stays visible behind it, which is what makes it a *pick* rather than a
 * place — and it is why nothing goes deeper than this.
 *
 * `title` is optional and usually absent: the lens picker is drawn as four bare rows
 * because four rows say what they are, and "lens" must never become user-facing
 * vocabulary (§16 #11).
 */
export function FittedPick<T extends string>({
  visible,
  title,
  options,
  selected,
  onSelect,
  onClose,
}: {
  visible: boolean;
  title?: string;
  options: readonly { readonly value: T; readonly label: string; readonly meta?: string }[];
  selected: T;
  onSelect: (value: T) => void;
  onClose: () => void;
}): React.JSX.Element {
  const t = useKoiTheme();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.pickScrim} onPress={onClose} accessibilityLabel="Close" />
      <View
        style={[
          styles.pickSheet,
          { backgroundColor: t.c.sheet, borderTopColor: t.c.hairline },
        ]}
      >
        <View style={[styles.pickGrabber, { backgroundColor: t.c.hairline }]} />
        {title !== undefined && (
          <Text style={[t.type.title, { fontSize: 15, paddingHorizontal: 16, paddingBottom: 10 }]}>
            {title}
          </Text>
        )}
        {options.map((option) => (
          <Pressable
            key={option.value}
            accessibilityRole="button"
            accessibilityState={{ selected: option.value === selected }}
            onPress={() => {
              onSelect(option.value);
              onClose();
            }}
            style={({ pressed }) => [
              styles.pickRow,
              { borderTopColor: t.c.hairline },
              pressed && { backgroundColor: t.ctl.secondaryPress },
            ]}
          >
            <Text style={[t.type.body, styles.flex]}>{option.label}</Text>
            {option.meta !== undefined && <Text style={t.type.dataSoft}>{option.meta}</Text>}
            {option.value === selected && (
              <Check size={15} color={t.c.domainText.fuel} strokeWidth={STROKE} />
            )}
          </Pressable>
        ))}
      </View>
    </Modal>
  );
}

/* ─── photography ─────────────────────────────────────────────────────────── */

/**
 * A photoless car gets a **warm placeholder block, never a grey box** — and never
 * the fuel green: the photo is identity, never data, and spending the app's one
 * green on a car breaks the colour law (sheet 04 §01).
 *
 * The sheets draw a two-stop warm gradient; no gradient dependency is installed
 * and one is not sanctioned, so this is the flat on-palette equivalent
 * (`domainWash.ink`), which is the same warmth in both schemes.
 */
export function PhotoPlaceholder({ height }: { height: number }): React.JSX.Element {
  const t = useKoiTheme();
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[styles.photo, { height, backgroundColor: t.c.domainWash.ink }]}
    >
      <Car size={34} color={t.c.inkFaint} strokeWidth={STROKE} />
    </View>
  );
}

/** The brand mark, as the two hero states draw it: a hairline square, accent. */
export function BrandMark({ size = 66 }: { size?: number }): React.JSX.Element {
  const t = useKoiTheme();
  return (
    <View
      style={[
        styles.brandMark,
        {
          width: size,
          height: size,
          borderRadius: Math.round(size * 0.29),
          borderColor: t.c.domain.fuel,
        },
      ]}
    >
      <Text
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={{ fontSize: Math.round(size * 0.44), color: t.c.domain.fuel }}
      >
        魚
      </Text>
    </View>
  );
}

/**
 * A Settings row: label, the current value, and which kind of thing happens next.
 * `page` pushes inside the sheet's own stack; `pick` fits and closes in place — the
 * same two-navigation distinction the car page's `›` / `…›` makes, at settings scale.
 */
export function SheetRow({
  label,
  value,
  trailing = 'page',
  onPress,
  last,
}: {
  label: string;
  value?: string;
  trailing?: 'page' | 'pick';
  onPress: () => void;
  last?: boolean;
}): React.JSX.Element {
  const t = useKoiTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.sheetRow,
        last !== true && {
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: t.c.hairline,
        },
        pressed && styles.pressed,
      ]}
    >
      <Text style={[t.type.body, styles.flex, { fontSize: 15.5 }]}>{label}</Text>
      {trailing === 'pick' ? (
        <Chip label={value ?? ''} species="filter" trailing="▾" />
      ) : (
        <>
          {value !== undefined && <Text style={[t.type.soft]}>{value}</Text>}
          <ChevronRight size={16} color={t.c.inkFaint} strokeWidth={STROKE} />
        </>
      )}
    </Pressable>
  );
}

/** A row that only navigates: no well, no value — Home's `All reminders ›`. */
export function LinkRow({
  label,
  meta,
  onPress,
}: {
  label: string;
  meta?: string;
  onPress: () => void;
}): React.JSX.Element {
  const t = useKoiTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.linkRow,
        { paddingVertical: t.space.md },
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.flex}>
        <Text style={t.type.body}>{label}</Text>
        {meta !== undefined && <Text style={t.type.faint}>{meta}</Text>}
      </View>
      <ChevronRight size={16} color={t.c.inkFaint} strokeWidth={STROKE} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  rootHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
  },
  settingsButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flex: { flex: 1 },
  pageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 4,
    paddingBottom: 11,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 8,
  },
  pageHeaderAction: { alignItems: 'flex-end' },
  labelledRule: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  labelledRuleText: { letterSpacing: 1.5 },
  row: { flexDirection: 'row', alignItems: 'center', minHeight: 58 },
  rowText: { flex: 1, gap: 2 },
  rowTrailing: { alignItems: 'flex-end' },
  pressed: { opacity: 0.6 },
  factRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 },
  factRowStacked: { flexDirection: 'column', alignItems: 'flex-start', gap: 2 },
  statHead: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  chip: { minHeight: 32, justifyContent: 'center', paddingHorizontal: 13, paddingVertical: 6 },
  chipInner: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center' },
  button: { minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  buttonCompact: { minHeight: 30, paddingVertical: 6 },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
  },
  field: { flexDirection: 'row', alignItems: 'center', minHeight: 44, paddingHorizontal: 12 },
  fieldInput: { flex: 1, paddingVertical: 10 },
  valueBoxText: { flex: 1, fontSize: 17, paddingVertical: 10 },
  gaugeTrack: { height: 9, borderRadius: 5, overflow: 'hidden' },
  gaugeFill: { height: 9 },
  scrim: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  confirmCard: { width: '100%', maxWidth: 360, padding: 20, gap: 8 },
  confirmActions: { flexDirection: 'row', marginTop: 8 },
  sheetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 48,
    paddingVertical: 12,
  },
  pickScrim: { flex: 1 },
  pickSheet: {
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 14,
    paddingBottom: 26,
  },
  pickGrabber: { width: 34, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 12 },
  pickRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 48,
    paddingHorizontal: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  photo: { alignItems: 'center', justifyContent: 'center' },
  brandMark: { borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', alignSelf: 'center' },
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 44 },
});
