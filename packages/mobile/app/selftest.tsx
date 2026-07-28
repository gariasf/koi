/**
 * The sync self-test screen: runs the S-6 / S-4 scenarios on THIS device, against
 * the real stack, and shows what passed.
 *
 * Why a screen and not a test runner: the point is to prove the semantics under
 * the app's actual runtime — Hermes, op-sqlite, the PowerSync React Native SDK —
 * not under Node with a different driver (CI covers that separately with the same
 * scenario module). Auto-running when `EXPO_PUBLIC_KOI_SELFTEST=1` also means a
 * screenshot of a launched app is the evidence.
 *
 * It writes real records (and deletes them). Dev only.
 */

import { useCallback, useEffect, useState } from 'react';
import { Text, View, StyleSheet } from 'react-native';

import { getSessionCookie } from '../src/auth/client';
import { runS6Scenarios, SCENARIO_COUNT, type ScenarioResult } from '../src/selftest/scenarios';
import { SELFTEST } from '../src/sync/config';
import { useKoi } from '../src/sync/provider';
import { crudQueueSettler } from '../src/sync/queue';
import { Button, Card, Screen, SectionLabel } from '../src/ui/components';
import { color, space, type } from '../src/ui/theme';

export default function SelfTestScreen(): React.JSX.Element {
  const { db, powersync, deviceId, apiUrl, connectError } = useKoi();
  const [running, setRunning] = useState(false);
  const [current, setCurrent] = useState<string | null>(null);
  const [results, setResults] = useState<ScenarioResult[] | null>(null);

  const run = useCallback(async () => {
    setRunning(true);
    setResults(null);
    try {
      const out = await runS6Scenarios({
        db,
        deviceId,
        apiUrl,
        getSessionCookie,
        onProgress: setCurrent,
        settle: crudQueueSettler(powersync),
      });
      setResults(out);
    } finally {
      setRunning(false);
      setCurrent(null);
    }
  }, [db, powersync, deviceId, apiUrl]);

  useEffect(() => {
    if (SELFTEST && connectError === null) void run();
  }, [run, connectError]);

  const passed = results?.filter((r) => r.passed).length ?? 0;
  const failed = results?.filter((r) => !r.passed) ?? [];

  // The route is in the bundle either way, so the guard is here rather than in
  // the router: this screen writes and deletes real records, and a deep link
  // (koi://selftest) must not be able to reach that in a shipped build.
  if (!SELFTEST) {
    return (
      <Screen>
        <Card>
          <Text style={type.title}>Not available</Text>
          <Text style={type.soft}>
            The sync self-test only runs in development builds started with
            EXPO_PUBLIC_KOI_SELFTEST=1.
          </Text>
        </Card>
      </Screen>
    );
  }

  return (
    <Screen>
      <Card>
        <Text style={type.title}>
          {results === null
            ? running
              ? `Running ${String(SCENARIO_COUNT)} scenarios…`
              : 'Sync self-test'
            : failed.length === 0
              ? `All ${String(passed)} scenarios pass`
              : `${String(passed)} of ${String(results.length)} pass`}
        </Text>
        <Text style={type.faint}>{apiUrl}</Text>
        <Text style={type.faint} selectable>
          {deviceId}
        </Text>
        {connectError !== null && (
          <Text style={[type.soft, { color: color.critical }]}>
            Not connected: {connectError}. The scenarios need the stack up.
          </Text>
        )}
        {current !== null && <Text style={type.soft}>{current}</Text>}
        {!running && <Button label="Run again" onPress={() => void run()} />}
      </Card>

      {results !== null && (
        <>
          <SectionLabel>Scenarios</SectionLabel>
          {results.map((result) => (
            <Card key={result.name}>
              <View style={styles.head}>
                <View
                  style={[
                    styles.dot,
                    { backgroundColor: result.passed ? color.positive : color.critical },
                  ]}
                />
                <Text style={[type.body, styles.name]}>{result.name}</Text>
              </View>
              <Text style={result.passed ? type.faint : [type.soft, { color: color.critical }]}>
                {result.detail}
              </Text>
            </Card>
          ))}
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  dot: { width: 10, height: 10, borderRadius: 5 },
  name: { flex: 1 },
});
