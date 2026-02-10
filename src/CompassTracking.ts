import { NativeMarfeelSdk } from './NativeMarfeelSdk';
import type {
  ConversionOptions,
  RFV,
  UserTypeValue,
} from './types';

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

  trackNewPage(url: string, options?: { rs?: string }): void {
    NativeMarfeelSdk.trackNewPage(url, options?.rs ?? null);
  },

  trackScreen(screen: string, options?: { rs?: string }): void {
    NativeMarfeelSdk.trackScreen(screen, options?.rs ?? null);
  },

  updateScrollPercentage(percentage: number): void {
    NativeMarfeelSdk.updateScrollPercentage(percentage);
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
