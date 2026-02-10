import React, { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { CompassTracking, UserType } from '@marfeel/react-native-sdk';

export function SettingsScreen() {
  const [siteUserId, setSiteUserId] = useState('');
  const [sessionVarName, setSessionVarName] = useState('');
  const [sessionVarValue, setSessionVarValue] = useState('');
  const [userVarName, setUserVarName] = useState('');
  const [userVarValue, setUserVarValue] = useState('');
  const [segmentInput, setSegmentInput] = useState('');
  const [consent, setConsent] = useState(true);
  const [result, setResult] = useState('');

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.sectionTitle}>User ID</Text>
      <View style={styles.row}>
        <TextInput
          style={styles.input}
          value={siteUserId}
          onChangeText={setSiteUserId}
          placeholder="Site User ID"
        />
        <Pressable
          style={styles.smallButton}
          onPress={() => CompassTracking.setSiteUserId(siteUserId)}
        >
          <Text style={styles.buttonText}>Set</Text>
        </Pressable>
      </View>
      <Pressable
        style={styles.button}
        onPress={async () => {
          const id = await CompassTracking.getUserId();
          setResult(`User ID: ${id}`);
        }}
      >
        <Text style={styles.buttonText}>Get User ID</Text>
      </Pressable>

      <Text style={styles.sectionTitle}>User Type</Text>
      <View style={styles.rowWrap}>
        <Pressable style={styles.smallButton} onPress={() => CompassTracking.setUserType(UserType.Anonymous)}>
          <Text style={styles.buttonText}>Anonymous</Text>
        </Pressable>
        <Pressable style={styles.smallButton} onPress={() => CompassTracking.setUserType(UserType.Logged)}>
          <Text style={styles.buttonText}>Logged</Text>
        </Pressable>
        <Pressable style={styles.smallButton} onPress={() => CompassTracking.setUserType(UserType.Paid)}>
          <Text style={styles.buttonText}>Paid</Text>
        </Pressable>
      </View>

      <Text style={styles.sectionTitle}>RFV</Text>
      <Pressable
        style={styles.button}
        onPress={async () => {
          const rfv = await CompassTracking.getRFV();
          setResult(rfv ? `RFV: ${rfv.rfv} (R:${rfv.r} F:${rfv.f} V:${rfv.v})` : 'RFV: null');
        }}
      >
        <Text style={styles.buttonText}>Get RFV</Text>
      </Pressable>

      <Text style={styles.sectionTitle}>Session Variable</Text>
      <View style={styles.row}>
        <TextInput style={styles.inputSmall} value={sessionVarName} onChangeText={setSessionVarName} placeholder="Name" />
        <TextInput style={styles.inputSmall} value={sessionVarValue} onChangeText={setSessionVarValue} placeholder="Value" />
        <Pressable style={styles.smallButton} onPress={() => CompassTracking.setSessionVar(sessionVarName, sessionVarValue)}>
          <Text style={styles.buttonText}>Set</Text>
        </Pressable>
      </View>

      <Text style={styles.sectionTitle}>User Variable</Text>
      <View style={styles.row}>
        <TextInput style={styles.inputSmall} value={userVarName} onChangeText={setUserVarName} placeholder="Name" />
        <TextInput style={styles.inputSmall} value={userVarValue} onChangeText={setUserVarValue} placeholder="Value" />
        <Pressable style={styles.smallButton} onPress={() => CompassTracking.setUserVar(userVarName, userVarValue)}>
          <Text style={styles.buttonText}>Set</Text>
        </Pressable>
      </View>

      <Text style={styles.sectionTitle}>User Segments</Text>
      <View style={styles.row}>
        <TextInput style={styles.input} value={segmentInput} onChangeText={setSegmentInput} placeholder="Segment name" />
        <Pressable style={styles.smallButton} onPress={() => CompassTracking.addUserSegment(segmentInput)}>
          <Text style={styles.buttonText}>Add</Text>
        </Pressable>
      </View>
      <View style={styles.rowWrap}>
        <Pressable style={styles.smallButton} onPress={() => CompassTracking.removeUserSegment(segmentInput)}>
          <Text style={styles.buttonText}>Remove</Text>
        </Pressable>
        <Pressable style={styles.smallButton} onPress={() => CompassTracking.clearUserSegments()}>
          <Text style={styles.buttonText}>Clear All</Text>
        </Pressable>
        <Pressable
          style={styles.smallButton}
          onPress={() => CompassTracking.setUserSegments(['seg_a', 'seg_b', 'seg_c'])}
        >
          <Text style={styles.buttonText}>Set Batch</Text>
        </Pressable>
      </View>

      <Text style={styles.sectionTitle}>Consent</Text>
      <View style={styles.row}>
        <Text style={styles.label}>Tracking Consent</Text>
        <Switch
          value={consent}
          onValueChange={(value) => {
            setConsent(value);
            CompassTracking.setConsent(value);
          }}
        />
      </View>

      {result !== '' && (
        <View style={styles.resultBox}>
          <Text style={styles.resultText}>{result}</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
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
  resultBox: {
    marginTop: 20,
    padding: 16,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  resultText: { fontSize: 14, fontFamily: 'monospace' },
});
