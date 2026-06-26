import React, { useCallback, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Cdp, type MeterState } from '@marfeel/react-native-sdk';

export function CdpScreen() {
  const [idType, setIdType] = useState('registered_user_id');
  const [idValue, setIdValue] = useState('demo-user@example.com');
  const [isDeterministic, setIsDeterministic] = useState(true);

  const [segment, setSegment] = useState('sports_fan');
  const [segmentsCsv, setSegmentsCsv] = useState('sports_fan,newsletter');

  const [meterName, setMeterName] = useState('paywall');

  const [log, setLog] = useState<string[]>([]);

  const appendLog = useCallback((line: string) => {
    setLog((prev) =>
      [`${new Date().toLocaleTimeString()}  ${line}`, ...prev].slice(0, 40)
    );
  }, []);

  const onLinkIdentity = () => {
    if (!idValue) return;
    Cdp.linkIdentity(idType, idValue, isDeterministic);
    appendLog(`linkIdentity ${idType}=${idValue} (deterministic=${isDeterministic})`);
  };

  const onGetData = async () => {
    try {
      const data = await Cdp.getData();
      appendLog(`getData → ${JSON.stringify(data)}`);
    } catch (e) {
      appendLog(`getData ERROR ${(e as Error).message}`);
    }
  };

  const onGetMasterId = async () => {
    try {
      const id = await Cdp.getMasterId();
      appendLog(`getMasterId → ${id ?? 'null'}`);
    } catch (e) {
      appendLog(`getMasterId ERROR ${(e as Error).message}`);
    }
  };

  const onAddSegment = () => {
    if (!segment) return;
    Cdp.addSegment(segment);
    appendLog(`addSegment ${segment}`);
  };

  const onRemoveSegment = () => {
    if (!segment) return;
    Cdp.removeSegment(segment);
    appendLog(`removeSegment ${segment}`);
  };

  const onSetSegments = () => {
    const list = segmentsCsv
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    Cdp.setSegments(list);
    appendLog(`setSegments [${list.join(', ')}]`);
  };

  const onClearSegments = () => {
    Cdp.clearSegments();
    appendLog('clearSegments');
  };

  const onGetSegments = async () => {
    try {
      const list = await Cdp.getSegments();
      appendLog(`getSegments → [${list.join(', ')}]`);
    } catch (e) {
      appendLog(`getSegments ERROR ${(e as Error).message}`);
    }
  };

  const formatMeter = (m: MeterState): string => {
    const threshold =
      m.threshold != null
        ? ` ${m.count}/${m.threshold} (remaining ${m.remaining}, reached ${m.reached})`
        : ` count ${m.count}`;
    return `${m.name}${threshold}`;
  };

  const onGetSnapshot = async () => {
    try {
      const meters = await Cdp.getMeterSnapshot();
      appendLog(
        meters.length
          ? `getMeterSnapshot → ${meters.map(formatMeter).join(' | ')}`
          : 'getMeterSnapshot → (none)'
      );
    } catch (e) {
      appendLog(`getMeterSnapshot ERROR ${(e as Error).message}`);
    }
  };

  const onListMeters = async () => {
    try {
      const meters = await Cdp.listMeters();
      appendLog(
        meters.length
          ? `listMeters → ${meters.map(formatMeter).join(' | ')}`
          : 'listMeters → (none)'
      );
    } catch (e) {
      appendLog(`listMeters ERROR ${(e as Error).message}`);
    }
  };

  const onGetMeter = async () => {
    if (!meterName) return;
    try {
      const meter = await Cdp.getMeter(meterName);
      appendLog(meter ? `getMeter → ${formatMeter(meter)}` : `getMeter ${meterName} → null`);
    } catch (e) {
      appendLog(`getMeter ERROR ${(e as Error).message}`);
    }
  };

  const onIncrementMeter = async () => {
    if (!meterName) return;
    try {
      const meter = await Cdp.incrementMeter(meterName);
      appendLog(meter ? `incrementMeter → ${formatMeter(meter)}` : `incrementMeter ${meterName} → null`);
    } catch (e) {
      appendLog(`incrementMeter ERROR ${(e as Error).message}`);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.hint}>
        CDP is enabled at init (enableCdp) with consent granted. Identity resolves
        automatically — watch the network for /cdp/identity/resolve. Use the actions
        below to trigger link, segment, and meter requests.
      </Text>

      <Text style={styles.sectionTitle}>Identity Link</Text>
      <View style={styles.row}>
        <TextInput
          style={styles.inputSmall}
          value={idType}
          onChangeText={setIdType}
          placeholder="id type"
          autoCapitalize="none"
        />
        <TextInput
          style={styles.inputSmall}
          value={idValue}
          onChangeText={setIdValue}
          placeholder="id value"
          autoCapitalize="none"
        />
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>Deterministic</Text>
        <Switch value={isDeterministic} onValueChange={setIsDeterministic} />
      </View>
      <Pressable style={styles.button} onPress={onLinkIdentity}>
        <Text style={styles.buttonText}>Link Identity</Text>
      </Pressable>

      <Text style={styles.sectionTitle}>Identity Data</Text>
      <View style={styles.rowWrap}>
        <Pressable style={styles.smallButton} onPress={onGetData}>
          <Text style={styles.buttonText}>getData</Text>
        </Pressable>
        <Pressable style={styles.smallButton} onPress={onGetMasterId}>
          <Text style={styles.buttonText}>getMasterId</Text>
        </Pressable>
      </View>

      <Text style={styles.sectionTitle}>Segments</Text>
      <View style={styles.row}>
        <TextInput
          style={styles.input}
          value={segment}
          onChangeText={setSegment}
          placeholder="single segment"
          autoCapitalize="none"
        />
        <Pressable style={styles.smallButton} onPress={onAddSegment}>
          <Text style={styles.buttonText}>Add</Text>
        </Pressable>
        <Pressable style={styles.smallButton} onPress={onRemoveSegment}>
          <Text style={styles.buttonText}>Remove</Text>
        </Pressable>
      </View>
      <TextInput
        style={styles.input}
        value={segmentsCsv}
        onChangeText={setSegmentsCsv}
        placeholder="comma,separated,segments"
        autoCapitalize="none"
      />
      <View style={styles.rowWrap}>
        <Pressable style={styles.smallButton} onPress={onSetSegments}>
          <Text style={styles.buttonText}>Set (replace)</Text>
        </Pressable>
        <Pressable style={styles.smallButton} onPress={onClearSegments}>
          <Text style={styles.buttonText}>Clear</Text>
        </Pressable>
        <Pressable style={styles.smallButton} onPress={onGetSegments}>
          <Text style={styles.buttonText}>Get</Text>
        </Pressable>
      </View>

      <Text style={styles.sectionTitle}>Meters</Text>
      <TextInput
        style={styles.input}
        value={meterName}
        onChangeText={setMeterName}
        placeholder="meter name (e.g. paywall)"
        autoCapitalize="none"
      />
      <View style={styles.rowWrap}>
        <Pressable style={styles.smallButton} onPress={onGetSnapshot}>
          <Text style={styles.buttonText}>Snapshot (fetch)</Text>
        </Pressable>
        <Pressable style={styles.smallButton} onPress={onListMeters}>
          <Text style={styles.buttonText}>List (cached)</Text>
        </Pressable>
      </View>
      <View style={styles.rowWrap}>
        <Pressable style={styles.smallButton} onPress={onGetMeter}>
          <Text style={styles.buttonText}>Get</Text>
        </Pressable>
        <Pressable style={styles.smallButton} onPress={onIncrementMeter}>
          <Text style={styles.buttonText}>Increment</Text>
        </Pressable>
      </View>

      <Text style={styles.sectionTitle}>Log</Text>
      <View style={styles.logBox}>
        {log.length === 0 ? (
          <Text style={styles.logEmpty}>No actions yet</Text>
        ) : (
          log.map((line, i) => (
            <Text key={i} style={styles.logLine}>
              {line}
            </Text>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  hint: { fontSize: 12, color: '#666', marginBottom: 8 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginTop: 20, marginBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  rowWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    marginBottom: 8,
  },
  inputSmall: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  smallButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  buttonText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  label: { fontSize: 16, flex: 1 },
  logBox: {
    padding: 12,
    backgroundColor: '#1e1e1e',
    borderRadius: 8,
    minHeight: 100,
  },
  logLine: { color: '#0f0', fontFamily: 'monospace', fontSize: 11, marginBottom: 2 },
  logEmpty: { color: '#888', fontSize: 12, fontStyle: 'italic' },
});
