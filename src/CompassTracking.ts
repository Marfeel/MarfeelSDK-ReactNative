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
  initialize(
    accountId: string,
    pageTechnology?: number,
    options?: { enableCdp?: boolean }
  ): void {
    NativeMarfeelSdk.initialize(
      accountId,
      pageTechnology ?? null,
      options?.enableCdp ?? false
    );
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

  getSessionId(): Promise<string> {
    return NativeMarfeelSdk.getSessionId();
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

  /**
   * Turns this device into a new visitor. Call it on sign-out. The native SDK drops the
   * site user id, mints a new user id, first visit and session, empties user vars and
   * segments and wipes the local CDP state before the returned promise is created; the
   * promise settles once the best-effort remote CDP reset finishes (bounded to five
   * seconds). It never rejects and never re-resolves identity: the next `trackNewPage`
   * does. The current page keeps its page id, so a sign-out that stays on screen should
   * be followed by a new `trackNewPage` / `trackScreen`.
   */
  resetUser(): Promise<void> {
    return NativeMarfeelSdk.resetUser().catch(() => undefined);
  },

  /** @deprecated Use `resetUser`. */
  resetIdentity(): Promise<void> {
    return CompassTracking.resetUser();
  },

  /**
   * The user segments as a beacon sends them (`useg`): the device-owned segments unioned
   * with the Server Segments the CDP asserts, server first, deduplicated and capped at
   * 100. Reads whatever Server Segments are known right now.
   */
  getUserSegments(): Promise<string[]> {
    return NativeMarfeelSdk.getUserSegments();
  },

  /** `getUserSegments` after resolving identity, so the Server Segments are current. */
  getUserSegmentsAsync(): Promise<string[]> {
    return NativeMarfeelSdk.getUserSegmentsAsync();
  },

  /**
   * The user vars as a beacon sends them (`uvar`): the device-owned vars followed by the
   * Server Properties the CDP computed for this user (device-owned wins on a collision).
   */
  getUserVars(): Promise<Record<string, string>> {
    return NativeMarfeelSdk.getUserVars();
  },

  /** `getUserVars` after resolving identity, so the Server Properties are current. */
  getUserVarsAsync(): Promise<Record<string, string>> {
    return NativeMarfeelSdk.getUserVarsAsync();
  },
};
