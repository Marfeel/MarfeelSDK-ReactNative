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
    getSessionId: vi.fn().mockResolvedValue('test-session-id'),
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
    resetUser: vi.fn().mockResolvedValue(undefined),
    getUserSegments: vi.fn().mockResolvedValue([]),
    getUserSegmentsAsync: vi.fn().mockResolvedValue([]),
    getUserVars: vi.fn().mockResolvedValue({}),
    getUserVarsAsync: vi.fn().mockResolvedValue({}),
    initializeMultimediaItem: vi.fn(),
    registerMultimediaEvent: vi.fn(),
    recirculationTrackEligible: vi.fn(),
    recirculationTrackImpression: vi.fn(),
    recirculationTrackClick: vi.fn(),
    experiencesAddTargeting: vi.fn(),
    experiencesFetch: vi.fn().mockResolvedValue('[]'),
    experiencesResolveContent: vi.fn().mockResolvedValue(null),
    experiencesTrackEligible: vi.fn(),
    experiencesTrackImpression: vi.fn(),
    experiencesTrackClick: vi.fn(),
    experiencesTrackClose: vi.fn(),
    experiencesClearFrequencyCaps: vi.fn(),
    experiencesGetFrequencyCapCounts: vi.fn().mockResolvedValue({}),
    experiencesGetFrequencyCapConfig: vi.fn().mockResolvedValue({}),
    experiencesClearReadEditorials: vi.fn(),
    experiencesGetReadEditorials: vi.fn().mockResolvedValue([]),
    experiencesGetExperimentAssignments: vi.fn().mockResolvedValue({}),
    experiencesSetExperimentAssignment: vi.fn(),
    experiencesClearExperimentAssignments: vi.fn(),
    cdpSetIdentity: vi.fn().mockResolvedValue(undefined),
    cdpDeleteIdentity: vi.fn().mockResolvedValue(undefined),
    cdpGetUserProfile: vi
      .fn()
      .mockResolvedValue(
        '{"masterId":null,"rfv":null,"cohorts":[],"identityFresh":false}'
      ),
    cdpGetMasterId: vi.fn().mockResolvedValue(null),
    cdpTrackConsent: vi.fn().mockResolvedValue(null),
    cdpGetConsent: vi.fn().mockResolvedValue(null),
    cdpHasConsent: vi.fn().mockResolvedValue(false),
    cdpListServerSegments: vi.fn().mockResolvedValue([]),
    cdpGetServerSegments: vi.fn().mockResolvedValue([]),
    cdpListServerProperties: vi.fn().mockResolvedValue({}),
    cdpGetServerProperties: vi.fn().mockResolvedValue({}),
    cdpHashEmail: vi.fn().mockResolvedValue('hash'),
    cdpHashPhone: vi.fn().mockResolvedValue('hash'),
    cdpAddSegment: vi.fn(),
    cdpRemoveSegment: vi.fn(),
    cdpSetSegments: vi.fn(),
    cdpClearSegments: vi.fn(),
    cdpGetSegments: vi.fn().mockResolvedValue([]),
    cdpGetMeterSnapshot: vi.fn().mockResolvedValue('[]'),
    cdpGetMeter: vi.fn().mockResolvedValue(null),
    cdpListMeters: vi.fn().mockResolvedValue('[]'),
    cdpIncrementMeter: vi.fn().mockResolvedValue(null),
  },
};

export const Platform = {
  select: vi.fn((obj: Record<string, unknown>) => obj.default || obj.ios),
};

export const findNodeHandle = vi.fn(() => 123);
export const ScrollView = 'ScrollView';
export const FlatList = 'FlatList';
export const SectionList = 'SectionList';
