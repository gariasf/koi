/**
 * Koi's design tokens — the authored light/dark pair, verbatim from the visual
 * design pass (`docs/build/design/README.md` §Design tokens and sheet 01 §08).
 *
 * Four rules travel with these values, and every one of them is a law rather
 * than a style (spec §D3, amendments §A/§B):
 *
 *  - **Dark is authored, not inverted.** `palette.dark` is a full sibling: a warm
 *    near-black ground in the light paper's hue family, its own ink ramp, its own
 *    semantics. An inverted `#43823B` is a mud green that stops being *the* accent.
 *  - **A well is `domainWash` + `domainText`.** The saturated `domain` step is for
 *    bars and gauge fills only — held to 3:1 and forbidden from carrying type.
 *  - **Emphasis is ink.** `control.primaryBg` is the darkest object on the surface;
 *    the accent means fuel money and nothing else. The one exception is tinted
 *    interactive *type* (back links, `Discard`, toast `Undo`, picker checkmarks),
 *    which takes `domainText.fuel` — it reads as tappable without competing for
 *    weight, and it inverts correctly in dark where ink IS the near-white.
 *  - **`positive` is a teal, deliberately not a green.** It used to be the exact
 *    same hex as `accent` and `domain.fuel` — a positive state and fuel money were
 *    literally one pixel, which §D3 forbids. It is now held for a future income
 *    surface and must not be spent elsewhere.
 *
 * `inkFaint` also moved: `#8C857A` scored 3,47:1 on paper and failed AA in the
 * exact role §H4 names as worst (dimmed archived rows over faint metas). `#787166`
 * is 4,59:1. Sheet 01 computes every ratio live from these hexes and is the source
 * of truth if they ever disagree.
 *
 * No hex is chosen here. Anything that looks like a decision was made on a sheet.
 */

export const palette = {
  light: {
    paper: '#FBF9F5',
    card: '#FFFFFF',
    sheet: '#FFFFFF',
    hairline: '#E6E1D8',
    ink: '#1C1A17',
    inkSoft: '#5B564E',
    inkFaint: '#787166',
    domain: { fuel: '#43823B', service: '#9C731A', expense: '#337FB8', contract: '#8A4879' },
    domainWash: {
      fuel: '#E7F0E5',
      service: '#F5EBD8',
      expense: '#E3EDF6',
      contract: '#F3E9F1',
      ink: '#EFEDE7',
      attention: '#F6E9DA',
    },
    domainText: {
      fuel: '#35692F',
      service: '#7E5C12',
      expense: '#24608F',
      contract: '#6E3960',
      ink: '#5B564E',
      attention: '#9C5A16',
    },
    attention: '#9C5A16',
    critical: '#A32D22',
    positive: '#1F6F63',
  },
  dark: {
    paper: '#14120F',
    card: '#211E19',
    // In light this equals `card`; in dark it must not, or a sheet over a
    // card-bearing parent disappears (sheet 01 §01).
    sheet: '#282420',
    hairline: '#2E2A24',
    ink: '#F4F0E8',
    inkSoft: '#B8B0A4',
    inkFaint: '#8F877A',
    domain: { fuel: '#4E9139', service: '#BB8826', expense: '#4E92CE', contract: '#A05C96' },
    domainWash: {
      fuel: '#1E2A1B',
      service: '#2E2417',
      expense: '#1C2731',
      contract: '#2A1F27',
      ink: '#262219',
      attention: '#2E2318',
    },
    domainText: {
      fuel: '#62A64C',
      service: '#D2A03C',
      expense: '#78B0DE',
      contract: '#C489BA',
      ink: '#B8B0A4',
      attention: '#E8934A',
    },
    attention: '#E8934A',
    critical: '#E86458',
    positive: '#4FA795',
  },
} as const;

/**
 * Control surfaces. `focusRing` is the ONE place the accent still surrounds a
 * control — a system affordance, not emphasis.
 */
export const control = {
  light: {
    primaryBg: '#1C1A17',
    primaryFg: '#FBF9F5',
    primaryPress: '#3B3733',
    secondaryBg: '#FFFFFF',
    secondaryPress: '#F2EFE8',
    ghostPress: '#EEF3EC',
    chipSelBg: '#F2EFE8',
    chipSelBorder: '#1C1A17',
    focusRing: '#43823B',
  },
  dark: {
    primaryBg: '#F4F0E8',
    primaryFg: '#14120F',
    primaryPress: '#CFC8BC',
    secondaryBg: '#211E19',
    secondaryPress: '#2B2721',
    ghostPress: '#1E2A1B',
    chipSelBg: '#2B2721',
    chipSelBorder: '#F4F0E8',
    focusRing: '#4E9139',
  },
} as const;

/** One shape scale, replacing eight unrelated ad-hoc radii. */
export const radius = {
  field: 8,
  button: 8,
  well: 10,
  cardInner: 12,
  card: 15,
  fab: 16,
  sheet: 26,
  chip: 999,
} as const;

/** Ink, never a coloured glow: §D7 has no glows (sheet 08 §G3). */
export const fab = {
  size: 52,
  radius: 16,
  shadow: { color: '#1C1A17', opacity: 0.18, radius: 18, offset: { width: 0, height: 6 } },
} as const;

/**
 * 150 ms fades everywhere; exactly one spring in the whole app (the fuel-capture
 * saved moment, which this session does not build). Reduce-motion gets fades only.
 */
export const motion = { fade: 150, spring: 'capture-success-only', reduceMotion: 'fade' } as const;

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;

/** Screen gutter — every root and pushed page uses the same 20 pt. */
export const gutter = 20;

/**
 * The bundled data face. **Never `Menlo`**: it is Apple-only and falls back to a
 * proportional face on Android, which breaks the one promise the data voice
 * exists to keep — numbers never jitter — on a co-equal target (amendments §C).
 */
export const MONO = 'IBMPlexMono_400Regular';
export const MONO_SEMIBOLD = 'IBMPlexMono_600SemiBold';

export type Scheme = 'light' | 'dark';
export type Palette = (typeof palette)[Scheme];
export type Control = (typeof control)[Scheme];
export type Domain = keyof Palette['domain'];
/** The five tints a record row can wear. `ink` is not a domain hue: it is the
 * surface's own line weight, worn by odometer, trip and note — distance and words
 * are not money. */
export type Tint = Domain | 'ink';
