import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { CompassTracking } from '@marfeel/react-native-sdk';
import { HomeScreen } from './src/screens/HomeScreen';
import { ArticleScreen } from './src/screens/ArticleScreen';
import { VideoScreen } from './src/screens/VideoScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import type { HomeStackParamList, RootTabParamList } from './src/navigation/types';

const Tab = createBottomTabNavigator<RootTabParamList>();
const HomeStack = createNativeStackNavigator<HomeStackParamList>();

function HomeStackNavigator() {
  return (
    <HomeStack.Navigator>
      <HomeStack.Screen name="ArticleList" component={HomeScreen} options={{ title: 'Articles' }} />
      <HomeStack.Screen name="ArticleDetail" component={ArticleScreen} options={({ route }) => ({ title: route.params.article.title })} />
    </HomeStack.Navigator>
  );
}

export default function App() {
  useEffect(() => {
    CompassTracking.initialize('1659', 105);
    CompassTracking.setConsent(true);
    CompassTracking.setLandingPage('http://dev.marfeel.co/');
    CompassTracking.trackScreen('home');
  }, []);

  return (
    <NavigationContainer>
      <Tab.Navigator screenOptions={{ headerShown: false }}>
        <Tab.Screen name="HomeTab" component={HomeStackNavigator} options={{ title: 'Home' }} />
        <Tab.Screen name="Video" component={VideoScreen} />
        <Tab.Screen name="Settings" component={SettingsScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
