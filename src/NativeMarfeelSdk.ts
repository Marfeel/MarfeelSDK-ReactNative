import { NativeModules, Platform } from 'react-native';

const LINKING_ERROR =
  `The package '@marfeel/react-native-sdk' doesn't seem to be linked. Make sure: \n\n` +
  Platform.select({ ios: "- You have run 'pod install'\n", default: '' }) +
  '- You rebuilt the app after installing the package\n' +
  '- You are not using Expo Go\n';

export interface NativeMarfeelSdkType {
  initialize(accountId: string, pageTechnology: number | null): void;
  trackNewPage(url: string, rs: string | null): void;
  trackScreen(screen: string, rs: string | null): void;
  updateScrollPercentage(percentage: number): void;
  stopTracking(): void;
  setLandingPage(landingPage: string): void;
  setSiteUserId(userId: string): void;
  getUserId(): Promise<string>;
  setUserType(userType: number): void;
  getRFV(): Promise<string | null>;
  setPageVar(name: string, value: string): void;
  setPageMetric(name: string, value: number): void;
  setSessionVar(name: string, value: string): void;
  setUserVar(name: string, value: string): void;
  addUserSegment(segment: string): void;
  setUserSegments(segments: string[]): void;
  removeUserSegment(segment: string): void;
  clearUserSegments(): void;
  trackConversion(
    conversion: string,
    initiator: string | null,
    id: string | null,
    value: string | null,
    meta: Record<string, string> | null,
    scope: string | null
  ): void;
  setConsent(hasConsent: boolean): void;
  initializeMultimediaItem(
    id: string,
    provider: string,
    providerId: string,
    type: string,
    metadata: string
  ): void;
  registerMultimediaEvent(id: string, event: string, eventTime: number): void;
}

export const NativeMarfeelSdk: NativeMarfeelSdkType = NativeModules.MarfeelSdk
  ? NativeModules.MarfeelSdk
  : new Proxy(
      {},
      {
        get() {
          throw new Error(LINKING_ERROR);
        },
      }
    );
