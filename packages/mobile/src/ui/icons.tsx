/**
 * The eight glyphs, and the well they live in.
 *
 * Lucide (ISC), drawn on one 24 px grid at **stroke 1.75** rather than the shipped
 * 2 — at 20 px the default reads chunky against Koi's type (annex B). Choosing a
 * whole family rather than eight files means every icon the app grows later
 * already shares a voice.
 *
 * A well is `domainWash` + a `domainText` glyph at radius 10 — **never** a
 * saturated fill and never emoji (amendment §B2). Two reasons, both found by
 * drawing it: a solid 40×40 block at full domain saturation is the heaviest object
 * on the row, heavier than the amount it is labelling; and emoji drags in its own
 * palette per platform, so "worn identically" breaks on the Android half of the
 * project. The saturated `domain` step is for bars and gauge fills only.
 *
 * Three wells are ink on purpose: odometer, trip and note are **not money**, so
 * they take the surface's own line weight and let the glyph do the identifying.
 * That is what stops a ledger from reading as seven palettes.
 */

import {
  Car,
  ChartColumn,
  Check,
  ChevronLeft,
  ChevronRight,
  FileText,
  Fuel,
  Gauge,
  House,
  List,
  NotebookPen,
  Plus,
  Receipt,
  Route,
  Settings,
  Shield,
  Wrench,
  type LucideIcon,
} from 'lucide-react-native';
import { View, type StyleProp, type ViewStyle } from 'react-native';

import { useKoiTheme } from './theme';

import type { Tint } from './tokens';

export const STROKE = 1.75;

/** The eight record kinds, and the hue each one wears. Fixed — never nine. */
export const RECORD_ICONS = {
  fuel: { glyph: Fuel, tint: 'fuel' },
  service: { glyph: Wrench, tint: 'service' },
  expense: { glyph: Receipt, tint: 'expense' },
  insurance: { glyph: Shield, tint: 'contract' },
  plan: { glyph: FileText, tint: 'contract' },
  odometer: { glyph: Gauge, tint: 'ink' },
  trip: { glyph: Route, tint: 'ink' },
  note: { glyph: NotebookPen, tint: 'ink' },
} as const satisfies Record<string, { glyph: LucideIcon; tint: Tint }>;

export type RecordKind = keyof typeof RECORD_ICONS;

export {
  Car,
  ChartColumn,
  Check,
  ChevronLeft,
  ChevronRight,
  House,
  List,
  Plus,
  Settings,
  type LucideIcon,
};

/**
 * An icon well. Decorative by construction — the row's title says what the record
 * is, so the glyph is hidden from the screen reader rather than read out twice.
 */
export function Well({
  kind,
  size = 40,
  style,
}: {
  kind: RecordKind;
  size?: number;
  style?: StyleProp<ViewStyle>;
}): React.JSX.Element {
  const t = useKoiTheme();
  const { glyph: Glyph, tint } = RECORD_ICONS[kind];
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        {
          width: size,
          height: size,
          borderRadius: t.radius.well,
          backgroundColor: t.c.domainWash[tint],
          alignItems: 'center',
          justifyContent: 'center',
        },
        style,
      ]}
    >
      <Glyph size={Math.round(size / 2)} color={t.c.domainText[tint]} strokeWidth={STROKE} />
    </View>
  );
}

/**
 * The attention well — an open review item's mark. `attention`, never `critical`:
 * a data disagreement is a fact waiting for a decision, not an error (§D5). It is
 * the wash pairing sheet 01's matrix validates (`attention` on `attentionWash`),
 * not the saturated block batch 1 drew before the tinted-well conversion.
 *
 * The mark is a square, not a glyph: §D7's Never list includes the exclamation
 * mark, and every "alert" icon in every set is built out of one.
 */
export function AttentionWell({ size = 38 }: { size?: number }): React.JSX.Element {
  const t = useKoiTheme();
  const mark = Math.round(size / 3.5);
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{
        width: size,
        height: size,
        borderRadius: t.radius.well,
        backgroundColor: t.c.domainWash.attention,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <View
        style={{
          width: mark,
          height: mark,
          borderRadius: 2,
          backgroundColor: t.c.attention,
        }}
      />
    </View>
  );
}

/**
 * A car's own well — for the archived row, where the card and its photo give way to
 * a row. Ink, like the odometer/trip/note wells: a car is not money either, and the
 * glyph identifies it. `dim` shelves it without dimming a photo, which reads as
 * broken (sheet 04 §01).
 */
export function CarWell({ size = 36, dim }: { size?: number; dim?: boolean }): React.JSX.Element {
  const t = useKoiTheme();
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{
        width: size,
        height: size,
        borderRadius: t.radius.well,
        backgroundColor: t.c.domainWash.ink,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: dim === true ? 0.75 : 1,
      }}
    >
      <Car size={Math.round(size / 2)} color={t.c.inkSoft} strokeWidth={STROKE} />
    </View>
  );
}

/** The 9 pt attention dot on a Garage card. `flex-shrink: 0` — see annex A. */
export function AttentionDot({ size = 9 }: { size?: number }): React.JSX.Element {
  const t = useKoiTheme();
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: t.c.attention,
        flexShrink: 0,
      }}
    />
  );
}
