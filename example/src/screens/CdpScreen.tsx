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
import {
  Cdp,
  CdpIdentityTypes,
  CompassTracking,
  type MeterState,
} from '@marfeel/react-native-sdk';

export function CdpScreen() {
  const [idType, setIdType] = useState('registered_user_id');
  const [idValue, setIdValue] = useState('demo-user@example.com');
  const [isDeterministic, setIsDeterministic] = useState(true);

  const [segment, setSegment] = useState('sports_fan');
  const [segmentsCsv, setSegmentsCsv] = useState('sports_fan,newsletter');

  const [meterName, setMeterName] = useState('paywall');
  const [consentId, setConsentId] = useState('privacy-policy');
  const [consentVersion, setConsentVersion] = useState('');
  const [consentEmail, setConsentEmail] = useState('');

  const [log, setLog] = useState<string[]>([]);

  const appendLog = useCallback((line: string) => {
    setLog((prev) =>
      [`${new Date().toLocaleTimeString()}  ${line}`, ...prev].slice(0, 40)
    );
  }, []);

  const onSetIdentity = async () => {
    if (!idValue) return;
    try {
      await Cdp.setIdentity(idType, idValue, isDeterministic);
      appendLog(`setIdentity ${idType}=${idValue} (deterministic=${isDeterministic}) → done`);
    } catch (e) {
      appendLog(`setIdentity ERROR ${(e as Error).message}`);
    }
  };

  const onSetHashedEmail = async () => {
    if (!idValue) return;
    try {
      const hashed = await Cdp.hashEmail(idValue);
      await Cdp.setIdentity(CdpIdentityTypes.EMAIL_SHA256, hashed, true);
      appendLog(`setIdentity email_sha256=${hashed.slice(0, 12)}… → done`);
    } catch (e) {
      appendLog(`setIdentity ERROR ${(e as Error).message}`);
    }
  };

  const onDeleteIdentity = async () => {
    try {
      await Cdp.deleteIdentity(idType, idValue || undefined);
      appendLog(`deleteIdentity ${idType}${idValue ? `=${idValue}` : ' (all)'} → done`);
    } catch (e) {
      appendLog(`deleteIdentity ERROR ${(e as Error).message}`);
    }
  };

  const onResetUser = async () => {
    await CompassTracking.resetUser();
    appendLog('resetUser → done (master-less until the next page)');
  };

  const onGetUserProfile = async () => {
    try {
      const data = await Cdp.getUserProfile();
      appendLog(`getUserProfile → ${JSON.stringify(data)}`);
    } catch (e) {
      appendLog(`getUserProfile ERROR ${(e as Error).message}`);
    }
  };

  const onGetServerData = async () => {
    try {
      const segments = await Cdp.listServerSegments();
      const properties = await Cdp.listServerProperties();
      const useg = await CompassTracking.getUserSegments();
      appendLog(`server segments [${segments.join(', ')}] props ${JSON.stringify(properties)} useg [${useg.join(', ')}]`);
    } catch (e) {
      appendLog(`server data ERROR ${(e as Error).message}`);
    }
  };

  const onGetConsent = async () => {
    const definition = await Cdp.getConsent({
      consentId,
      versionId: consentVersion || undefined,
    });
    appendLog(definition ? `getConsent → ${JSON.stringify(definition)}` : 'getConsent → null');
  };

  const onHasConsent = async () => {
    const granted = await Cdp.hasConsent({
      consentId,
      versionId: consentVersion || undefined,
      email: consentEmail || undefined,
    });
    appendLog(`hasConsent ${consentId} → ${granted}`);
  };

  const onTrackConsent = async (status: 'accepted' | 'rejected') => {
    const result = await Cdp.trackConsent({
      consentId,
      versionId: consentVersion || '1',
      status,
      metadata: { source: 'example-app' },
      email: consentEmail || undefined,
    });
    appendLog(result ? `trackConsent ${status} → ${JSON.stringify(result)}` : `trackConsent ${status} → null`);
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
      <View style={styles.rowWrap}>
        <Pressable style={styles.smallButton} onPress={onSetIdentity}>
          <Text style={styles.buttonText}>setIdentity</Text>
        </Pressable>
        <Pressable style={styles.smallButton} onPress={onSetHashedEmail}>
          <Text style={styles.buttonText}>hash + set email_sha256</Text>
        </Pressable>
        <Pressable style={styles.smallButton} onPress={onDeleteIdentity}>
          <Text style={styles.buttonText}>deleteIdentity</Text>
        </Pressable>
      </View>
      <Pressable style={styles.dangerButton} onPress={onResetUser}>
        <Text style={styles.buttonText}>Reset user (sign-out)</Text>
      </Pressable>

      <Text style={styles.sectionTitle}>Identity Data</Text>
      <View style={styles.rowWrap}>
        <Pressable style={styles.smallButton} onPress={onGetUserProfile}>
          <Text style={styles.buttonText}>getUserProfile</Text>
        </Pressable>
        <Pressable style={styles.smallButton} onPress={onGetMasterId}>
          <Text style={styles.buttonText}>getMasterId</Text>
        </Pressable>
        <Pressable style={styles.smallButton} onPress={onGetServerData}>
          <Text style={styles.buttonText}>server segments / props</Text>
        </Pressable>
      </View>

      <Text style={styles.sectionTitle}>Publisher consents</Text>
      <View style={styles.row}>
        <TextInput
          style={styles.inputSmall}
          value={consentId}
          onChangeText={setConsentId}
          placeholder="consent id"
          autoCapitalize="none"
        />
        <TextInput
          style={styles.inputSmall}
          value={consentVersion}
          onChangeText={setConsentVersion}
          placeholder="version (optional)"
          autoCapitalize="none"
        />
      </View>
      <TextInput
        style={styles.input}
        value={consentEmail}
        onChangeText={setConsentEmail}
        placeholder="email (optional, hashed on device)"
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <View style={styles.rowWrap}>
        <Pressable style={styles.smallButton} onPress={onGetConsent}>
          <Text style={styles.buttonText}>getConsent</Text>
        </Pressable>
        <Pressable style={styles.smallButton} onPress={onHasConsent}>
          <Text style={styles.buttonText}>hasConsent</Text>
        </Pressable>
        <Pressable style={styles.smallButton} onPress={() => onTrackConsent('accepted')}>
          <Text style={styles.buttonText}>accept</Text>
        </Pressable>
        <Pressable style={styles.smallButton} onPress={() => onTrackConsent('rejected')}>
          <Text style={styles.buttonText}>reject</Text>
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
  dangerButton: {
    backgroundColor: '#C62828',
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
