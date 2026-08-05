/**
 * `useKoiTheme()` — the resolved half of the token pair, plus the two
 * accessibility facts every surface has to answer to.
 *
 * Dark mode is co-primary (article 9) and the palette is authored, not inverted,
 * so "the theme" is a *selection*, never a transform: every component reads
 * `t.c.<role>` and gets the right hex in both schemes without knowing which one
 * it is in.
 *
 * Three things travel with it because they change layout rather than colour:
 *
 *  - **`reduceMotion`** — §D7's reduce-motion path is *fades only*. The one spring
 *    in the app checks this, and so does the toast's draining hairline.
 *  - **`fontScale` / `stacked`** — every two-column construct reflows to one column
 *    at the largest dynamic-type sizes (§H4). The fact-row label column must not be
 *    a fixed width; the old 118 pt cap truncated exactly where reflow was required.
 *  - **`appearance`** — System / Light / Dark, device-local. It ships in the same
 *    increment as the palette and not earlier (D-059): a Dark option that selects a
 *    palette nobody drew is worse than no control.
 *
 * Micro-labels are `textTransform: 'uppercase'` **here**, in the style layer, and
 * are authored in sentence case — a screen reader reading "WHERE IT WENT" has
 * nothing to strip (amendments §C).
 */

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  AccessibilityInfo,
  useColorScheme,
  useWindowDimensions,
  type TextStyle,
} from 'react-native';

import {
  MONO,
  MONO_SEMIBOLD,
  control,
  fab,
  gutter,
  motion,
  palette,
  radius,
  space,
  type Control,
  type Palette,
  type Scheme,
} from './tokens';
import { readAppearance, writeAppearance } from './settings-store';

import type { KoiDb } from '../data/db';
import type { Appearance } from './settings-store';

export type { Appearance };

export interface KoiType {
  readonly display: TextStyle;
  readonly title: TextStyle;
  readonly body: TextStyle;
  readonly soft: TextStyle;
  readonly faint: TextStyle;
  readonly data: TextStyle;
  readonly dataSoft: TextStyle;
  readonly dataFaint: TextStyle;
  readonly micro: TextStyle;
  /** The 30/700 root-page title. Pushed pages use `title`. */
  readonly pageTitle: TextStyle;
  /** Tinted interactive type — the accent's one non-fuel job (§B1). */
  readonly link: TextStyle;
}

export interface KoiTheme {
  readonly scheme: Scheme;
  readonly appearance: Appearance;
  readonly setAppearance: (next: Appearance) => void;
  readonly c: Palette;
  readonly ctl: Control;
  readonly radius: typeof radius;
  readonly fab: typeof fab;
  readonly motion: typeof motion;
  readonly space: typeof space;
  readonly gutter: number;
  readonly type: KoiType;
  readonly reduceMotion: boolean;
  readonly fontScale: number;
  /** True at the dynamic-type sizes where two-column constructs must reflow. */
  readonly stacked: boolean;
}

function makeType(c: Palette): KoiType {
  const mono: TextStyle = { fontFamily: MONO, fontVariant: ['tabular-nums'] };
  return {
    display: { fontSize: 28, fontWeight: '600', letterSpacing: -0.34, color: c.ink },
    pageTitle: { fontSize: 30, fontWeight: '700', letterSpacing: -0.6, color: c.ink },
    title: { fontSize: 19, fontWeight: '600', color: c.ink },
    body: { fontSize: 15, color: c.ink },
    soft: { fontSize: 14, color: c.inkSoft },
    faint: { fontSize: 13, color: c.inkFaint },
    data: { ...mono, fontSize: 15, color: c.ink },
    dataSoft: { ...mono, fontSize: 13, color: c.inkSoft },
    dataFaint: { ...mono, fontSize: 12, color: c.inkFaint },
    micro: {
      fontFamily: MONO_SEMIBOLD,
      fontSize: 11,
      letterSpacing: 1,
      textTransform: 'uppercase',
      color: c.inkFaint,
    },
    link: { fontSize: 15, color: c.domainText.fuel },
  };
}

export function buildTheme(
  scheme: Scheme,
  extras: {
    appearance: Appearance;
    setAppearance: (next: Appearance) => void;
    reduceMotion: boolean;
    fontScale: number;
  },
): KoiTheme {
  const c = palette[scheme];
  return {
    scheme,
    appearance: extras.appearance,
    setAppearance: extras.setAppearance,
    c,
    ctl: control[scheme],
    radius,
    fab,
    motion,
    space,
    gutter,
    type: makeType(c),
    reduceMotion: extras.reduceMotion,
    fontScale: extras.fontScale,
    stacked: extras.fontScale >= 1.35,
  };
}

const KoiThemeContext = createContext<KoiTheme | null>(null);

export function useKoiTheme(): KoiTheme {
  const value = useContext(KoiThemeContext);
  if (value === null) throw new Error('useKoiTheme outside KoiThemeProvider');
  return value;
}

/**
 * The scheme the OS asks for, before any provider exists — used by the two
 * surfaces that render *while the database is still opening* (`KoiProvider`'s
 * "Opening…" and its fatal screen). They cannot wait for a context that lives
 * inside them, and they must still be the right colour on a dark phone.
 */
export function useOsScheme(): Scheme {
  return useColorScheme() === 'dark' ? 'dark' : 'light';
}

export function useOsPalette(): Palette {
  return palette[useOsScheme()];
}

export function KoiThemeProvider({
  db,
  children,
}: {
  db: KoiDb;
  children: React.ReactNode;
}): React.JSX.Element {
  const osScheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const { fontScale } = useWindowDimensions();
  const [appearance, setAppearanceState] = useState<Appearance>('system');
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void readAppearance(db).then((value) => {
      if (!cancelled) setAppearanceState(value);
    });
    void AccessibilityInfo.isReduceMotionEnabled().then((on) => {
      if (!cancelled) setReduceMotion(on);
    });
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => {
      cancelled = true;
      sub.remove();
    };
  }, [db]);

  const theme = useMemo(
    () =>
      buildTheme(appearance === 'system' ? osScheme : appearance, {
        appearance,
        setAppearance: (next) => {
          setAppearanceState(next);
          void writeAppearance(db, next);
        },
        reduceMotion,
        fontScale,
      }),
    [appearance, osScheme, reduceMotion, fontScale, db],
  );

  return <KoiThemeContext.Provider value={theme}>{children}</KoiThemeContext.Provider>;
}
