import React, { useEffect } from 'react';
import {
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { CompassTracking } from '@marfeel/react-native-sdk';
import { articles } from '../data/articles';
import type { Article } from '../data/articles';
import type { HomeStackParamList } from '../navigation/types';

type NavigationProp = NativeStackNavigationProp<HomeStackParamList, 'ArticleList'>;

export function HomeScreen() {
  const navigation = useNavigation<NavigationProp>();

  useEffect(() => {
    CompassTracking.setLandingPage('http://dev.marfeel.co/');
  }, []);

  function renderArticle({ item }: { item: Article }) {
    return (
      <Pressable
        style={styles.card}
        onPress={() => navigation.navigate('ArticleDetail', { article: item })}
      >
        <Image source={{ uri: item.imageUrl }} style={styles.image} />
        <View style={styles.cardContent}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.subtitle}>{item.subtitle}</Text>
          <Text style={styles.category}>{item.category.toUpperCase()}</Text>
        </View>
      </Pressable>
    );
  }

  return (
    <FlatList
      data={articles}
      keyExtractor={(item) => item.id}
      renderItem={renderArticle}
      contentContainerStyle={styles.list}
    />
  );
}

const styles = StyleSheet.create({
  list: { padding: 16 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  image: { width: '100%', height: 180 },
  cardContent: { padding: 12 },
  title: { fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#666', marginBottom: 8 },
  category: { fontSize: 12, color: '#007AFF', fontWeight: '600' },
});
