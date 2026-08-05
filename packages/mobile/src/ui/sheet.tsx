/**
 * Task-sheet chrome, and the dirty guard.
 *
 * A sheet is where you *do* something (§D1): it has no tab bar, it never presents a
 * second tall surface, and it continues by inline swap or by pushing on its own
 * internal stack. Its header is `Discard · title · Save` in tinted type — the
 * accent's one non-fuel job.
 *
 * **The dirty guard** (sheet 03, sheet 07 §7.7): while a form has unsaved input the
 * sheet is pinned — swipe-to-close is disabled and every exit asks *Discard this
 * fill? / Keep editing*. It wins over a notification deep-link's modal teardown,
 * because a half-typed fill is unrecoverable while a notification is still sitting
 * in Notification Center. That is why the guard hangs off `beforeRemove` rather
 * than off the Discard button: the button is only one of the ways out.
 */

import { useNavigation } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Confirm } from './controls';
import { useKoiTheme } from './theme';

export function SheetHeader({
  title,
  onCancel,
  cancelLabel = 'Discard',
  onSave,
  saveLabel = 'Save',
  saveDisabled,
}: {
  title: string;
  onCancel: () => void;
  cancelLabel?: string;
  onSave?: () => void;
  saveLabel?: string;
  saveDisabled?: boolean;
}): React.JSX.Element {
  const t = useKoiTheme();
  // A modal sheet is presented *below* the status bar, so its own top inset is 0 and
  // the header needs no extra room. A sheet that ends up full-screen instead (nothing
  // behind it to present over) reports the real notch inset, and then the header has
  // to move down or it draws over the clock.
  const insets = useSafeAreaInsets();
  const notch = insets.top > 20 ? insets.top : 0;
  return (
    <View
      style={[
        styles.header,
        { borderBottomColor: t.c.hairline, backgroundColor: t.c.sheet, paddingTop: notch + 14 },
      ]}
    >
      <Pressable
        onPress={onCancel}
        accessibilityRole="button"
        hitSlop={8}
        style={styles.headerSide}
      >
        <Text style={t.type.link}>{cancelLabel}</Text>
      </Pressable>
      <Text style={[t.type.title, styles.headerTitle]} accessibilityRole="header">
        {title}
      </Text>
      <View style={[styles.headerSide, styles.headerRight]}>
        {onSave !== undefined && (
          <Pressable
            onPress={onSave}
            disabled={saveDisabled === true}
            accessibilityRole="button"
            accessibilityState={{ disabled: saveDisabled === true }}
            hitSlop={8}
          >
            <Text
              style={[
                t.type.link,
                { fontWeight: '500' },
                saveDisabled === true && { color: t.c.inkFaint },
              ]}
            >
              {saveLabel}
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

/** The sheet body: the `sheet` surface, one step above the card-bearing parent. */
export function SheetBody({
  children,
  scroll = true,
}: {
  children: React.ReactNode;
  scroll?: boolean;
}): React.JSX.Element {
  const t = useKoiTheme();
  if (!scroll) {
    return <View style={[styles.body, { backgroundColor: t.c.sheet }]}>{children}</View>;
  }
  return (
    <ScrollView
      style={[styles.body, { backgroundColor: t.c.sheet }]}
      contentContainerStyle={{ padding: t.gutter, gap: t.space.lg }}
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </ScrollView>
  );
}

/**
 * Pins a sheet while it is dirty, and returns the guarded exit.
 *
 * `subject` names what would be lost, so the question is about the user's work
 * rather than about the sheet: *Discard this fill?*, *Discard this reading?*
 */
export function useDirtyGuard(
  dirty: boolean,
  subject: string,
  leave: () => void,
): { readonly requestExit: () => void; readonly guard: React.JSX.Element } {
  const navigation = useNavigation();
  const [asking, setAsking] = useState(false);
  // Set the instant the user chooses Discard: the listener is still installed and
  // `dirty` is still true, so without it the very navigation the user just
  // authorised would be blocked by its own guard.
  const discarding = useRef(false);

  // Swipe-to-close is disabled outright while dirty: a gesture that can lose
  // typed input should not be available and then questioned.
  useEffect(() => {
    navigation.setOptions({ gestureEnabled: !dirty });
  }, [navigation, dirty]);

  // Every other way out — Back, a deep link's teardown, a programmatic dismiss —
  // arrives here. The guard wins; the deep link waits.
  useEffect(() => {
    const sub = navigation.addListener('beforeRemove', (event: { preventDefault: () => void }) => {
      if (!dirty || discarding.current) return;
      event.preventDefault();
      setAsking(true);
    });
    return sub;
  }, [navigation, dirty]);

  const requestExit = useCallback(() => {
    if (dirty) {
      setAsking(true);
      return;
    }
    leave();
  }, [dirty, leave]);

  const guard = (
    <Confirm
      visible={asking}
      title={`Discard this ${subject}?`}
      body={[`Nothing is saved. What you typed is lost.`]}
      confirmLabel="Discard"
      cancelLabel="Keep editing"
      onCancel={() => setAsking(false)}
      onConfirm={() => {
        setAsking(false);
        discarding.current = true;
        navigation.setOptions({ gestureEnabled: true });
        leave();
      }}
    />
  );

  return { requestExit, guard };
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerSide: { minWidth: 72, minHeight: 28, justifyContent: 'center' },
  headerRight: { alignItems: 'flex-end' },
  headerTitle: { fontSize: 16, flex: 1, textAlign: 'center' },
  body: { flex: 1 },
});
