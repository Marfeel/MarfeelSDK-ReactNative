import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MultimediaTracking, MultimediaType, MultimediaEvent } from '@marfeel/react-native-sdk';
import { videoItem } from '../data/articles';

export function VideoScreen() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isInitialized, setIsInitialized] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    MultimediaTracking.initializeItem(
      videoItem.id,
      videoItem.provider,
      videoItem.providerId,
      MultimediaType.Video,
      {
        title: videoItem.title,
        duration: videoItem.duration,
        url: `https://youtube.com/watch?v=${videoItem.providerId}`,
        description: 'Sample video for SDK testing',
        authors: 'Marfeel',
      },
    );
    setIsInitialized(true);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        setCurrentTime((t) => {
          const next = t + 1;
          if (next >= videoItem.duration) {
            setIsPlaying(false);
            MultimediaTracking.registerEvent(videoItem.id, MultimediaEvent.End, next);
            if (intervalRef.current) clearInterval(intervalRef.current);
            return videoItem.duration;
          }
          MultimediaTracking.registerEvent(videoItem.id, MultimediaEvent.UpdateCurrentTime, next);
          return next;
        });
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying]);

  const togglePlay = useCallback(() => {
    if (!isInitialized) return;
    const next = !isPlaying;
    setIsPlaying(next);
    MultimediaTracking.registerEvent(
      videoItem.id,
      next ? MultimediaEvent.Play : MultimediaEvent.Pause,
      currentTime,
    );
  }, [isPlaying, currentTime, isInitialized]);

  const progress = videoItem.duration > 0 ? currentTime / videoItem.duration : 0;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{videoItem.title}</Text>

      <View style={styles.player}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
        </View>
        <Text style={styles.time}>
          {Math.floor(currentTime / 60)}:{String(currentTime % 60).padStart(2, '0')} / {Math.floor(videoItem.duration / 60)}:{String(videoItem.duration % 60).padStart(2, '0')}
        </Text>
      </View>

      <View style={styles.controls}>
        <Pressable style={styles.button} onPress={togglePlay}>
          <Text style={styles.buttonText}>{isPlaying ? 'Pause' : 'Play'}</Text>
        </Pressable>

        <Pressable
          style={styles.button}
          onPress={() => MultimediaTracking.registerEvent(videoItem.id, MultimediaEvent.Mute, currentTime)}
        >
          <Text style={styles.buttonText}>Mute</Text>
        </Pressable>

        <Pressable
          style={styles.button}
          onPress={() => MultimediaTracking.registerEvent(videoItem.id, MultimediaEvent.Unmute, currentTime)}
        >
          <Text style={styles.buttonText}>Unmute</Text>
        </Pressable>

        <Pressable
          style={styles.button}
          onPress={() => MultimediaTracking.registerEvent(videoItem.id, MultimediaEvent.FullScreen, currentTime)}
        >
          <Text style={styles.buttonText}>Fullscreen</Text>
        </Pressable>

        <Pressable
          style={styles.button}
          onPress={() => MultimediaTracking.registerEvent(videoItem.id, MultimediaEvent.EnterViewport, currentTime)}
        >
          <Text style={styles.buttonText}>Enter Viewport</Text>
        </Pressable>

        <Pressable
          style={styles.button}
          onPress={() => MultimediaTracking.registerEvent(videoItem.id, MultimediaEvent.LeaveViewport, currentTime)}
        >
          <Text style={styles.buttonText}>Leave Viewport</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 20 },
  player: { marginBottom: 24 },
  progressBar: {
    height: 8,
    backgroundColor: '#ddd',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: { height: '100%', backgroundColor: '#007AFF' },
  time: { fontSize: 14, color: '#666', textAlign: 'center' },
  controls: { gap: 12 },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
