/**
 * The app-level toast host — and the fix for a real data-loss bug.
 *
 * Before this file, "one toast at a time" was true only *per screen*, across three
 * separate mounts, which is why a car delete had to smuggle its message to the
 * garage through a route param. Worse: the undo closure lived in the same state as
 * the toast, so **a second delete inside six seconds silently made the first
 * permanent.** The user was offered an undo, did nothing wrong, and lost it.
 *
 * The separation that fixes it (amendment B10 / §16 #8): **the toast is a view, the
 * undo closure is state.** Toasts still supersede one another visually — the newest
 * message wins the surface and restarts the draining hairline — while closures
 * accumulate in a queue and each expires on its own 6 s. The collapsed copy
 * (`2 records deleted.`) is then just an honest label for a queue that already
 * exists, and one `Undo` restores all of it.
 *
 * Timing rules (§D7): success 3 s · undo 6 s behind a draining hairline · an error
 * persists until dismissed. `Undo` and `Retry` are the only actions allowed to ride
 * in a toast. The surface never turns red — the hairline carries the state.
 *
 * One hard-won detail, carried forward from the per-screen version: **a timer must
 * never depend on a closure identity.** Every call site writes
 * `() => setToast(null)`-shaped lambdas that are fresh on every render, and a live
 * query firing elsewhere re-renders constantly — an effect that depended on them
 * would restart the 3 s/6 s clock on renders that have nothing to do with the
 * toast. Here the effects depend only on ids and counters, and the newest closure
 * is read through a ref.
 */

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';

import { useKoiTheme } from './theme';

const SUCCESS_MS = 3000;
const UNDO_MS = 6000;

interface UndoEntry {
  readonly id: number;
  /** The message shown while this is the only pending closure. */
  readonly message: string;
  readonly restore: () => void | Promise<void>;
}

interface Notice {
  readonly id: number;
  readonly message: string;
  readonly tone: 'success' | 'error';
  readonly retry?: () => void;
}

export interface ToastApi {
  /** A success: 3 s, no action. */
  readonly show: (message: string) => void;
  /**
   * A delete that can still be taken back. `message` is the single-record copy;
   * when more than one closure is pending the host collapses to `N records
   * deleted.` and one Undo restores every one of them.
   */
  readonly showUndo: (message: string, restore: () => void | Promise<void>) => void;
  /** Persists until dismissed. A sentence, never a raw error string. */
  readonly showError: (message: string, retry?: () => void) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

export function useToast(): ToastApi {
  const value = useContext(ToastContext);
  if (value === null) throw new Error('useToast outside ToastHost');
  return value;
}

export function ToastHost({ children }: { children: React.ReactNode }): React.JSX.Element {
  const t = useKoiTheme();
  const [pending, setPending] = useState<readonly UndoEntry[]>([]);
  const [notice, setNotice] = useState<Notice | null>(null);
  const nextId = useRef(0);
  const drain = useRef(new Animated.Value(1)).current;

  const api = useMemo<ToastApi>(
    () => ({
      show: (message) => {
        setNotice({ id: nextId.current++, message, tone: 'success' });
      },
      showError: (message, retry) => {
        setNotice({
          id: nextId.current++,
          message,
          tone: 'error',
          ...(retry === undefined ? {} : { retry }),
        });
      },
      showUndo: (message, restore) => {
        const id = nextId.current++;
        // A notice must not outlive the delete it was about: the newest event
        // owns the surface (§D7's "one at a time").
        setNotice(null);
        setPending((queue) => [...queue, { id, message, restore }]);
        setTimeout(() => {
          setPending((queue) => queue.filter((e) => e.id !== id));
        }, UNDO_MS);
      },
    }),
    [],
  );

  const newestUndoId = pending.length === 0 ? null : (pending[pending.length - 1]?.id ?? null);

  // The hairline restarts when a NEW closure arrives — that is the visual
  // supersede — and never when an old one expires: the queue shrinking is not an
  // event the user caused.
  useEffect(() => {
    if (newestUndoId === null) return;
    drain.setValue(1);
    if (t.reduceMotion) return;
    const animation = Animated.timing(drain, {
      toValue: 0,
      duration: UNDO_MS,
      useNativeDriver: false,
    });
    animation.start();
    return () => {
      animation.stop();
    };
  }, [newestUndoId, drain, t.reduceMotion]);

  useEffect(() => {
    if (notice === null || notice.tone === 'error') return;
    const timer = setTimeout(() => {
      setNotice((current) => (current?.id === notice.id ? null : current));
    }, SUCCESS_MS);
    return () => {
      clearTimeout(timer);
    };
  }, [notice]);

  const undoAll = useCallback(() => {
    setPending((queue) => {
      for (const entry of queue) void entry.restore();
      return [];
    });
  }, []);

  const visible: {
    message: string;
    action?: { label: 'Undo' | 'Retry'; onPress: () => void };
    tone: 'success' | 'error' | 'undo';
  } | null =
    pending.length > 0
      ? {
          message:
            pending.length === 1
              ? (pending[0]?.message ?? '')
              : `${String(pending.length)} records deleted.`,
          action: { label: 'Undo', onPress: undoAll },
          tone: 'undo',
        }
      : notice === null
        ? null
        : {
            message: notice.message,
            tone: notice.tone,
            ...(notice.retry === undefined
              ? {}
              : { action: { label: 'Retry' as const, onPress: notice.retry } }),
          };

  return (
    <ToastContext.Provider value={api}>
      {children}
      {visible !== null && (
        <View
          style={[
            styles.toast,
            {
              backgroundColor: t.c.sheet,
              borderColor: t.c.hairline,
              borderRadius: 13,
              shadowColor: '#1C1A17',
              shadowOpacity: t.scheme === 'dark' ? 0 : 0.09,
            },
          ]}
          accessibilityLiveRegion="polite"
        >
          <View style={styles.body}>
            {visible.tone === 'error' && (
              <View style={[styles.errorMark, { backgroundColor: t.c.attention }]} />
            )}
            <Text style={[t.type.body, styles.message]}>{visible.message}</Text>
            {visible.action !== undefined && (
              <Pressable
                onPress={() => {
                  visible.action?.onPress();
                  if (visible.tone !== 'undo') setNotice(null);
                }}
                accessibilityRole="button"
                style={styles.action}
              >
                <Text style={[t.type.link, { fontWeight: '500' }]}>{visible.action.label}</Text>
              </Pressable>
            )}
            {visible.tone === 'error' && visible.action === undefined && (
              <Pressable
                onPress={() => setNotice(null)}
                accessibilityRole="button"
                style={styles.action}
              >
                <Text style={[t.type.body, { color: t.c.inkSoft }]}>Close</Text>
              </Pressable>
            )}
          </View>
          {visible.tone === 'undo' && (
            <View style={[styles.track, { backgroundColor: t.c.hairline }]}>
              <Animated.View
                style={[
                  styles.fill,
                  {
                    backgroundColor: t.c.inkSoft,
                    width: drain.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', '100%'],
                    }),
                  },
                ]}
              />
            </View>
          )}
        </View>
      )}
    </ToastContext.Provider>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 96,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  body: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12, minHeight: 44 },
  message: { flex: 1 },
  action: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 4 },
  errorMark: { width: 8, height: 8, borderRadius: 2 },
  track: { height: 2 },
  fill: { height: 2 },
});
