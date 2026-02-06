import type { RefObject } from 'react';
import type { ScrollView } from 'react-native';
import { findNodeHandle } from 'react-native';
import { NativeMarfeelSdk } from './NativeMarfeelSdk';
import type {
  ConversionOptions,
  RFV,
  TrackingOptions,
  UserTypeValue,
} from './types';

function getScrollViewTag(ref?: RefObject<ScrollView>): number | null {
  if (!ref?.current) return null;
  return findNodeHandle(ref.current);
}

function getUserTypeNumericValue(userType: UserTypeValue): number {
  if (typeof userType === 'object' && 'custom' in userType) {
    return userType.custom;
  }
  return userType;
}

export const CompassTracking = {
  initialize(accountId: string, pageTechnology?: number): void {
    NativeMarfeelSdk.initialize(accountId, pageTechnology ?? null);
  },

  trackNewPage(
    url: string,
    options?: TrackingOptions & { scrollViewRef?: RefObject<ScrollView> }
  ): void {
    const scrollViewTag = options?.scrollViewRef
      ? getScrollViewTag(options.scrollViewRef)
      : options?.scrollViewTag ?? null;
    NativeMarfeelSdk.trackNewPage(url, scrollViewTag, options?.rs ?? null);
  },

  trackScreen(
    screen: string,
    options?: TrackingOptions & { scrollViewRef?: RefObject<ScrollView> }
  ): void {
    const scrollViewTag = options?.scrollViewRef
      ? getScrollViewTag(options.scrollViewRef)
      : options?.scrollViewTag ?? null;
    NativeMarfeelSdk.trackScreen(screen, scrollViewTag, options?.rs ?? null);
  },

  stopTracking(): void {
    NativeMarfeelSdk.stopTracking();
  },

  setLandingPage(landingPage: string): void {
    NativeMarfeelSdk.setLandingPage(landingPage);
  },

  setSiteUserId(userId: string): void {
    NativeMarfeelSdk.setSiteUserId(userId);
  },

  getUserId(): Promise<string> {
    return NativeMarfeelSdk.getUserId();
  },

  setUserType(userType: UserTypeValue): void {
    NativeMarfeelSdk.setUserType(getUserTypeNumericValue(userType));
  },

  async getRFV(): Promise<RFV | null> {
    const result = await NativeMarfeelSdk.getRFV();
    if (!result) return null;
    return JSON.parse(result) as RFV;
  },

  setPageVar(name: string, value: string): void {
    NativeMarfeelSdk.setPageVar(name, value);
  },

  setPageMetric(name: string, value: number): void {
    NativeMarfeelSdk.setPageMetric(name, value);
  },

  setSessionVar(name: string, value: string): void {
    NativeMarfeelSdk.setSessionVar(name, value);
  },

  setUserVar(name: string, value: string): void {
    NativeMarfeelSdk.setUserVar(name, value);
  },

  addUserSegment(segment: string): void {
    NativeMarfeelSdk.addUserSegment(segment);
  },

  setUserSegments(segments: string[]): void {
    NativeMarfeelSdk.setUserSegments(segments);
  },

  removeUserSegment(segment: string): void {
    NativeMarfeelSdk.removeUserSegment(segment);
  },

  clearUserSegments(): void {
    NativeMarfeelSdk.clearUserSegments();
  },

  trackConversion(conversion: string, options?: ConversionOptions): void {
    NativeMarfeelSdk.trackConversion(
      conversion,
      options?.initiator ?? null,
      options?.id ?? null,
      options?.value ?? null,
      options?.meta ?? null,
      options?.scope ?? null
    );
  },

  setConsent(hasConsent: boolean): void {
    NativeMarfeelSdk.setConsent(hasConsent);
  },
};
