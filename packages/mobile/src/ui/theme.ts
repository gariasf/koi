/**
 * The minimum of Koi's visual law (§D3) this session needs: warm paper surfaces,
 * ink for everything that is not "what kind of money", and reserved semantic
 * colors. The four domain hues are here so the app never invents a fifth, but
 * only ink + attention are used by these screens — no chart, no money surface
 * exists yet.
 *
 * Dark mode is co-primary in the spec (authored, never an inversion pass); this
 * scaffold ships the light pair only and reads the system scheme nowhere yet.
 * That is a known gap, not a decision — the real palette work belongs with the
 * app surface (BOARD bucket D).
 */

import type { TextStyle } from 'react-native';

export const color = {
  paper: '#FBF9F5',
  card: '#FFFFFF',
  ink: '#1C1A17',
  inkSoft: '#5B564E',
  inkFaint: '#8C857A',
  hairline: '#E6E1D8',
  /** The app accent — and the fuel domain hue. One green in the app. */
  accent: '#43823B',
  attention: '#9C5A16',
  critical: '#A32D22',
  positive: '#43823B',
  /** Domain hues (§D3): worn by a record's icon well and its charts, never as "series 4". */
  domain: {
    fuel: '#43823B',
    service: '#9C731A',
    expense: '#337FB8',
    contract: '#8A4879',
  },
} as const;

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;

export const radius = { sm: 6, md: 10, lg: 14 } as const;

/**
 * Three type voices (§D7): display, text, and data — the monospaced tabular one
 * that every number wears so numbers never jitter.
 */
export const type: Record<
  'display' | 'title' | 'body' | 'soft' | 'faint' | 'micro' | 'data',
  TextStyle
> = {
  display: { fontSize: 28, fontWeight: '600', color: color.ink },
  title: { fontSize: 19, fontWeight: '600', color: color.ink },
  body: { fontSize: 15, color: color.ink },
  soft: { fontSize: 14, color: color.inkSoft },
  faint: { fontSize: 13, color: color.inkFaint },
  micro: { fontSize: 11, letterSpacing: 0.8, color: color.inkFaint, fontWeight: '600' },
  data: { fontSize: 15, fontVariant: ['tabular-nums'], fontFamily: 'Menlo' },
};
