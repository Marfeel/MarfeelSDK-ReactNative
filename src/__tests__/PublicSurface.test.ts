import { describe, it, expect } from 'vitest';
import { Cdp } from '../Cdp';
import { CompassTracking } from '../CompassTracking';

const cdpNames = [
  'IdentityTypes',
  'setIdentity',
  'deleteIdentity',
  'linkIdentity',
  'getUserProfile',
  'getData',
  'getMasterId',
  'trackConsent',
  'getConsent',
  'hasConsent',
  'normalizeEmail',
  'normalizePhone',
  'hashEmail',
  'hashPhone',
  'addSegment',
  'removeSegment',
  'setSegments',
  'clearSegments',
  'getSegments',
  'listServerSegments',
  'getServerSegments',
  'listServerProperties',
  'getServerProperties',
  'getMeterSnapshot',
  'getMeter',
  'listMeters',
  'incrementMeter',
];

const trackingNames = [
  'resetUser',
  'getUserSegments',
  'getUserSegmentsAsync',
  'getUserVars',
  'getUserVarsAsync',
  'setSiteUserId',
  'setUserVar',
  'addUserSegment',
  'setUserSegments',
  'removeUserSegment',
  'clearUserSegments',
  'setConsent',
  'getUserId',
  'getSessionId',
];

describe('public surface is add-only', () => {
  it('every name on Cdp stays put', () => {
    const missing = cdpNames.filter((name) => !(name in Cdp));
    expect(missing).toEqual([]);
  });

  it('every CDP-adjacent name on CompassTracking stays put', () => {
    const missing = trackingNames.filter((name) => !(name in CompassTracking));
    expect(missing).toEqual([]);
  });
});
