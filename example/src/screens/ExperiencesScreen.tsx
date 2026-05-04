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
  Experiences,
  Recirculation,
  type Experience,
  type RecirculationLink,
} from '@marfeel/react-native-sdk';

const SAMPLE_LINKS: RecirculationLink[] = [
  { url: 'https://example.com/article-1', position: 0 },
  { url: 'https://example.com/article-2', position: 1 },
];

export function ExperiencesScreen() {
  const [targetingKey, setTargetingKey] = useState('');
  const [targetingValue, setTargetingValue] = useState('');

  const [filterByType, setFilterByType] = useState('');
  const [filterByFamily, setFilterByFamily] = useState('');
  const [resolve, setResolve] = useState(false);
  const [urlOverride, setUrlOverride] = useState('');

  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [resolvedById, setResolvedById] = useState<Record<string, string>>({});
  const [log, setLog] = useState<string[]>([]);

  const [recirculationName, setRecirculationName] = useState('module-demo');

  const [freqCapId, setFreqCapId] = useState('');
  const [experimentGroup, setExperimentGroup] = useState('');
  const [experimentVariant, setExperimentVariant] = useState('');

  const appendLog = useCallback((line: string) => {
    setLog((prev) => [`${new Date().toLocaleTimeString()}  ${line}`, ...prev].slice(0, 30));
  }, []);

  const onAddTargeting = () => {
    if (!targetingKey) return;
    Experiences.addTargeting(targetingKey, targetingValue);
    appendLog(`addTargeting ${targetingKey}=${targetingValue}`);
  };

  const onFetch = async () => {
    try {
      const results = await Experiences.fetchExperiences({
        filterByType: (filterByType || undefined) as Experience['type'] | undefined,
        filterByFamily: (filterByFamily || undefined) as NonNullable<
          Experience['family']
        > | undefined,
        resolve,
        url: urlOverride || undefined,
      });
      setExperiences(results);
      setResolvedById({});
      appendLog(`fetchExperiences → ${results.length} results`);
    } catch (e) {
      appendLog(`fetchExperiences ERROR ${(e as Error).message}`);
    }
  };

  const onResolveOne = async (exp: Experience) => {
    try {
      const content = await Experiences.resolveContent(exp);
      setResolvedById((prev) => ({ ...prev, [exp.id]: content ?? '(null)' }));
      appendLog(`resolveContent ${exp.id} → ${content ? `${content.length} chars` : 'null'}`);
    } catch (e) {
      appendLog(`resolveContent ERROR ${(e as Error).message}`);
    }
  };

  const onTrackEligibleAll = () => {
    experiences.forEach((e) => Experiences.trackEligible(e, SAMPLE_LINKS));
    appendLog(`trackEligible × ${experiences.length}`);
  };

  const onTrackImpression = (exp: Experience) => {
    Experiences.trackImpression(exp, SAMPLE_LINKS);
    appendLog(`trackImpression ${exp.id}`);
  };

  const onTrackClick = (exp: Experience) => {
    Experiences.trackClick(exp, SAMPLE_LINKS[0]!);
    appendLog(`trackClick ${exp.id}`);
  };

  const onTrackClose = (exp: Experience) => {
    Experiences.trackClose(exp);
    appendLog(`trackClose ${exp.id}`);
  };

  const onRecirculationEligible = () => {
    Recirculation.trackEligible(recirculationName, SAMPLE_LINKS);
    appendLog(`Recirculation.trackEligible ${recirculationName}`);
  };
  const onRecirculationImpression = () => {
    Recirculation.trackImpression(recirculationName, SAMPLE_LINKS);
    appendLog(`Recirculation.trackImpression ${recirculationName}`);
  };
  const onRecirculationClick = () => {
    Recirculation.trackClick(recirculationName, SAMPLE_LINKS[0]!);
    appendLog(`Recirculation.trackClick ${recirculationName}`);
  };

  const onShowFreqCapCounts = async () => {
    if (!freqCapId) return;
    const counts = await Experiences.getFrequencyCapCounts(freqCapId);
    appendLog(`freqCapCounts ${freqCapId} → ${JSON.stringify(counts)}`);
  };
  const onShowFreqCapConfig = async () => {
    const config = await Experiences.getFrequencyCapConfig();
    appendLog(`freqCapConfig → ${JSON.stringify(config)}`);
  };
  const onClearFreqCaps = () => {
    Experiences.clearFrequencyCaps();
    appendLog('clearFrequencyCaps');
  };

  const onShowExperiments = async () => {
    const a = await Experiences.getExperimentAssignments();
    appendLog(`experiments → ${JSON.stringify(a)}`);
  };
  const onSetExperiment = () => {
    if (!experimentGroup || !experimentVariant) return;
    Experiences.setExperimentAssignment(experimentGroup, experimentVariant);
    appendLog(`setExperiment ${experimentGroup}=${experimentVariant}`);
  };
  const onClearExperiments = () => {
    Experiences.clearExperimentAssignments();
    appendLog('clearExperimentAssignments');
  };

  const onShowReadEditorials = async () => {
    const ids = await Experiences.getReadEditorials();
    appendLog(`readEditorials → ${JSON.stringify(ids)}`);
  };
  const onClearReadEditorials = () => {
    Experiences.clearReadEditorials();
    appendLog('clearReadEditorials');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.sectionTitle}>Targeting</Text>
      <View style={styles.row}>
        <TextInput
          style={styles.inputSmall}
          value={targetingKey}
          onChangeText={setTargetingKey}
          placeholder="key"
          autoCapitalize="none"
        />
        <TextInput
          style={styles.inputSmall}
          value={targetingValue}
          onChangeText={setTargetingValue}
          placeholder="value"
          autoCapitalize="none"
        />
        <Pressable style={styles.smallButton} onPress={onAddTargeting}>
          <Text style={styles.buttonText}>Add</Text>
        </Pressable>
      </View>

      <Text style={styles.sectionTitle}>Fetch Experiences</Text>
      <View style={styles.row}>
        <TextInput
          style={styles.inputSmall}
          value={filterByType}
          onChangeText={setFilterByType}
          placeholder="filter type (e.g. adManager)"
          autoCapitalize="none"
        />
        <TextInput
          style={styles.inputSmall}
          value={filterByFamily}
          onChangeText={setFilterByFamily}
          placeholder="filter family"
          autoCapitalize="none"
        />
      </View>
      <TextInput
        style={styles.input}
        value={urlOverride}
        onChangeText={setUrlOverride}
        placeholder="url override (optional)"
        autoCapitalize="none"
      />
      <View style={styles.row}>
        <Text style={styles.label}>Resolve content</Text>
        <Switch value={resolve} onValueChange={setResolve} />
      </View>
      <Pressable style={styles.button} onPress={onFetch}>
        <Text style={styles.buttonText}>Fetch</Text>
      </Pressable>

      {experiences.length > 0 && (
        <>
          <View style={styles.row}>
            <Text style={styles.subtitle}>{experiences.length} experiences</Text>
            <Pressable style={styles.smallButton} onPress={onTrackEligibleAll}>
              <Text style={styles.buttonText}>Eligible × all</Text>
            </Pressable>
          </View>

          {experiences.map((exp) => (
            <View key={exp.id} style={styles.expCard}>
              <Text style={styles.expTitle}>{exp.name}</Text>
              <Text style={styles.expMeta}>id: {exp.id}</Text>
              <Text style={styles.expMeta}>
                type: {exp.type} · family: {exp.family ?? '—'} · contentType:{' '}
                {exp.contentType}
              </Text>
              {exp.contentUrl && (
                <Text style={styles.expMeta} numberOfLines={2}>
                  contentUrl: {exp.contentUrl}
                </Text>
              )}
              <View style={styles.rowWrap}>
                <Pressable style={styles.smallButton} onPress={() => onTrackImpression(exp)}>
                  <Text style={styles.buttonText}>Impression</Text>
                </Pressable>
                <Pressable style={styles.smallButton} onPress={() => onTrackClick(exp)}>
                  <Text style={styles.buttonText}>Click</Text>
                </Pressable>
                <Pressable style={styles.smallButton} onPress={() => onTrackClose(exp)}>
                  <Text style={styles.buttonText}>Close</Text>
                </Pressable>
                <Pressable style={styles.smallButton} onPress={() => onResolveOne(exp)}>
                  <Text style={styles.buttonText}>Resolve</Text>
                </Pressable>
              </View>
              {(resolvedById[exp.id] ?? exp.resolvedContent) && (
                <Text style={styles.resolvedContent} numberOfLines={6}>
                  {resolvedById[exp.id] ?? exp.resolvedContent}
                </Text>
              )}
            </View>
          ))}
        </>
      )}

      <Text style={styles.sectionTitle}>Recirculation (manual)</Text>
      <TextInput
        style={styles.input}
        value={recirculationName}
        onChangeText={setRecirculationName}
        placeholder="module name"
        autoCapitalize="none"
      />
      <View style={styles.rowWrap}>
        <Pressable style={styles.smallButton} onPress={onRecirculationEligible}>
          <Text style={styles.buttonText}>Eligible</Text>
        </Pressable>
        <Pressable style={styles.smallButton} onPress={onRecirculationImpression}>
          <Text style={styles.buttonText}>Impression</Text>
        </Pressable>
        <Pressable style={styles.smallButton} onPress={onRecirculationClick}>
          <Text style={styles.buttonText}>Click</Text>
        </Pressable>
      </View>

      <Text style={styles.sectionTitle}>QA: Frequency Caps</Text>
      <View style={styles.row}>
        <TextInput
          style={styles.input}
          value={freqCapId}
          onChangeText={setFreqCapId}
          placeholder="experience id"
          autoCapitalize="none"
        />
        <Pressable style={styles.smallButton} onPress={onShowFreqCapCounts}>
          <Text style={styles.buttonText}>Counts</Text>
        </Pressable>
      </View>
      <View style={styles.rowWrap}>
        <Pressable style={styles.smallButton} onPress={onShowFreqCapConfig}>
          <Text style={styles.buttonText}>Config</Text>
        </Pressable>
        <Pressable style={styles.smallButton} onPress={onClearFreqCaps}>
          <Text style={styles.buttonText}>Clear</Text>
        </Pressable>
      </View>

      <Text style={styles.sectionTitle}>QA: Experiments</Text>
      <View style={styles.row}>
        <TextInput
          style={styles.inputSmall}
          value={experimentGroup}
          onChangeText={setExperimentGroup}
          placeholder="groupId"
          autoCapitalize="none"
        />
        <TextInput
          style={styles.inputSmall}
          value={experimentVariant}
          onChangeText={setExperimentVariant}
          placeholder="variantId"
          autoCapitalize="none"
        />
        <Pressable style={styles.smallButton} onPress={onSetExperiment}>
          <Text style={styles.buttonText}>Set</Text>
        </Pressable>
      </View>
      <View style={styles.rowWrap}>
        <Pressable style={styles.smallButton} onPress={onShowExperiments}>
          <Text style={styles.buttonText}>Show</Text>
        </Pressable>
        <Pressable style={styles.smallButton} onPress={onClearExperiments}>
          <Text style={styles.buttonText}>Clear</Text>
        </Pressable>
      </View>

      <Text style={styles.sectionTitle}>QA: Read Editorials</Text>
      <View style={styles.rowWrap}>
        <Pressable style={styles.smallButton} onPress={onShowReadEditorials}>
          <Text style={styles.buttonText}>Show</Text>
        </Pressable>
        <Pressable style={styles.smallButton} onPress={onClearReadEditorials}>
          <Text style={styles.buttonText}>Clear</Text>
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
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginTop: 20, marginBottom: 8 },
  subtitle: { flex: 1, fontSize: 14, color: '#666' },
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
  expCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  expTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  expMeta: { fontSize: 12, color: '#555', marginBottom: 2 },
  resolvedContent: {
    marginTop: 8,
    padding: 8,
    backgroundColor: '#f5f5f5',
    borderRadius: 4,
    fontFamily: 'monospace',
    fontSize: 11,
    color: '#333',
  },
  logBox: {
    padding: 12,
    backgroundColor: '#1e1e1e',
    borderRadius: 8,
    minHeight: 100,
  },
  logLine: { color: '#0f0', fontFamily: 'monospace', fontSize: 11, marginBottom: 2 },
  logEmpty: { color: '#888', fontSize: 12, fontStyle: 'italic' },
});
