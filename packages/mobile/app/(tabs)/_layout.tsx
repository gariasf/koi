import { Tabs } from 'expo-router/js-tabs';
import { StyleSheet } from 'react-native';

import { Car, ChartColumn, House, List, STROKE } from '../../src/ui/icons';
import { useKoiTheme } from '../../src/ui/theme';

/**
 * Four tabs, never five — and no `+` among them, because **creating is not a place
 * you go** (sheet 03 §01). The `+` floats over the body on every root and opens the
 * capture chooser; Settings floats top-right and opens its own sheet. Neither is a
 * tab, and neither is a row buried inside Garage.
 *
 * `popToTopOnBlur` is the "leaving resets the stack" half of §D1: coming back to
 * History lands on History, not on a record page from last Tuesday. What **survives**
 * a tab switch is *screen state* — filter chips, car scope, lens, page size — and it
 * survives for free, because popping to the top never unmounts the root screen.
 * Resetting those would make the sacred ledger read as silently partial.
 *
 * The active tint is the accent at its text step (`domainText.fuel`): tinted type is
 * the accent's one non-fuel job, and a tab label is type.
 */
export default function TabsLayout(): React.JSX.Element {
  const t = useKoiTheme();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        popToTopOnBlur: true,
        tabBarActiveTintColor: t.c.domainText.fuel,
        tabBarInactiveTintColor: t.c.inkFaint,
        tabBarStyle: {
          backgroundColor: t.c.paper,
          borderTopColor: t.c.hairline,
          borderTopWidth: StyleSheet.hairlineWidth,
        },
        tabBarLabelStyle: { fontSize: 10.5 },
        sceneStyle: { backgroundColor: t.c.paper },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <House size={19} color={color} strokeWidth={STROKE} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarIcon: ({ color }) => <List size={19} color={color} strokeWidth={STROKE} />,
        }}
      />
      <Tabs.Screen
        name="insights"
        options={{
          title: 'Insights',
          tabBarIcon: ({ color }) => <ChartColumn size={19} color={color} strokeWidth={STROKE} />,
        }}
      />
      <Tabs.Screen
        name="garage"
        options={{
          title: 'Garage',
          tabBarIcon: ({ color }) => <Car size={19} color={color} strokeWidth={STROKE} />,
        }}
      />
    </Tabs>
  );
}
