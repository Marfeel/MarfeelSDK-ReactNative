import React, { useEffect } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  CompassTracking,
  CompassScrollView,
  ConversionScope,
} from '@marfeel/react-native-sdk';
import type { HomeStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<HomeStackParamList, 'ArticleDetail'>;

export function ArticleScreen({ route }: Props) {
  const { article } = route.params;

  useEffect(() => {
    CompassTracking.trackNewPage(article.url, { rs: article.rs });
    CompassTracking.setPageVar('category', article.category);
    CompassTracking.setPageMetric('wordCount', article.wordCount);

    return () => {
      CompassTracking.stopTracking();
    };
  }, [article]);

  return (
    <CompassScrollView contentContainerStyle={styles.container}>
      <Image source={{ uri: article.imageUrl }} style={styles.image} />
      <View style={styles.content}>
        <Text style={styles.title}>{article.title}</Text>
        <Text style={styles.subtitle}>{article.subtitle}</Text>
        <Text style={styles.body}>{article.body}</Text>

        <View style={styles.actions}>
          <Pressable
            style={styles.button}
            onPress={() =>
              CompassTracking.trackConversion('article_read', {
                scope: ConversionScope.Page,
              })
            }
          >
            <Text style={styles.buttonText}>Track Conversion</Text>
          </Pressable>

          <Pressable
            style={styles.button}
            onPress={() =>
              CompassTracking.addUserSegment(`${article.category}_reader`)
            }
          >
            <Text style={styles.buttonText}>Add Segment</Text>
          </Pressable>

          <Pressable
            style={styles.button}
            onPress={() =>
              CompassTracking.trackConversion('conv_with_meta', {
                initiator: 'testInit',
                id: 'testId',
                value: 'testValue',
                meta: { key1: 'val1', key2: 'val2' },
                scope: ConversionScope.Page,
              })
            }
          >
            <Text style={styles.buttonText}>Conversion with Meta</Text>
          </Pressable>
        </View>
      </View>
    </CompassScrollView>
  );
}

const styles = StyleSheet.create({
  container: { paddingBottom: 40 },
  image: { width: '100%', height: 250 },
  content: { padding: 16 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 4 },
  subtitle: { fontSize: 16, color: '#666', marginBottom: 16 },
  body: { fontSize: 16, lineHeight: 24, color: '#333', marginBottom: 24 },
  actions: { gap: 12 },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
