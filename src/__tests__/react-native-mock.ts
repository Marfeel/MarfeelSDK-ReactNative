import { vi } from 'vitest';

export const NativeModules = {
  MarfeelSdk: {
    initialize: vi.fn(),
    trackNewPage: vi.fn(),
    trackScreen: vi.fn(),
    stopTracking: vi.fn(),
    setLandingPage: vi.fn(),
    setSiteUserId: vi.fn(),
    getUserId: vi.fn().mockResolvedValue('test-user-id'),
    setUserType: vi.fn(),
    getRFV: vi.fn().mockResolvedValue('{"rfv":0.5,"r":1,"f":2,"v":3}'),
    setPageVar: vi.fn(),
    setPageMetric: vi.fn(),
    setSessionVar: vi.fn(),
    setUserVar: vi.fn(),
    addUserSegment: vi.fn(),
    setUserSegments: vi.fn(),
    removeUserSegment: vi.fn(),
    clearUserSegments: vi.fn(),
    trackConversion: vi.fn(),
    setConsent: vi.fn(),
    initializeMultimediaItem: vi.fn(),
    registerMultimediaEvent: vi.fn(),
  },
};

export const Platform = {
  select: vi.fn((obj: Record<string, unknown>) => obj.default || obj.ios),
};

export const findNodeHandle = vi.fn(() => 123);
export const ScrollView = 'ScrollView';
export const FlatList = 'FlatList';
export const SectionList = 'SectionList';
