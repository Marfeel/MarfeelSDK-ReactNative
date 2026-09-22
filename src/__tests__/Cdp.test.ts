import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NativeModules } from 'react-native';
import { Cdp } from '../Cdp';
import { CdpIdentityTypes } from '../types';
import type { CdpConsentDefinition, MeterState } from '../types';

const mockNativeModule = NativeModules.MarfeelSdk;

const meteredWithThreshold: MeterState = {
  name: 'paywall',
  count: 3,
  threshold: 5,
  reached: false,
  remaining: 2,
  startedAt: '2026-06-01T00:00:00.000Z',
  expiresAt: '2026-07-01T00:00:00.000Z',
  window: { duration: 'calendar', period: 'P1M', tz: 'Europe/Madrid' },
};

const meterWithoutThreshold: MeterState = {
  name: 'views',
  count: 7,
  window: { duration: '', period: '', tz: '' },
};

const definition: CdpConsentDefinition = {
  consentId: 'privacy',
  name: 'Privacy policy',
  purpose: 'legal',
  mandatory: true,
  acceptMethod: 'check-box',
  showPolicy: 'if-not-accepted',
  version: {
    versionId: '3',
    label: 'v3',
    date: '2026-01-01',
    displayPrompt: 'Please accept',
    errorMessage: 'You must accept',
    metadata: { k: 'v' },
  },
};

describe('Cdp', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('setIdentity', () => {
    it('defaults isDeterministic to false and resolves with the native promise', async () => {
      await expect(
        Cdp.setIdentity(CdpIdentityTypes.REGISTERED_USER_ID, 'user@example.com')
      ).resolves.toBeUndefined();
      expect(mockNativeModule.cdpSetIdentity).toHaveBeenCalledWith(
        'registered_user_id',
        'user@example.com',
        false
      );
    });

    it('forwards an explicit isDeterministic flag', async () => {
      await Cdp.setIdentity('crm_id', 'abc', true);
      expect(mockNativeModule.cdpSetIdentity).toHaveBeenCalledWith(
        'crm_id',
        'abc',
        true
      );
    });

    it('rejects an empty value or type without reaching native', async () => {
      await expect(Cdp.setIdentity('email', '')).rejects.toBeInstanceOf(
        TypeError
      );
      await expect(Cdp.setIdentity('', 'x')).rejects.toBeInstanceOf(TypeError);
      expect(mockNativeModule.cdpSetIdentity).not.toHaveBeenCalled();
    });

    it('propagates a native rejection', async () => {
      mockNativeModule.cdpSetIdentity.mockRejectedValueOnce(
        new Error('CDP_SET_IDENTITY')
      );
      await expect(Cdp.setIdentity('email', 'x')).rejects.toThrow(
        'CDP_SET_IDENTITY'
      );
    });
  });

  describe('deleteIdentity', () => {
    it('forwards a null value when none is given', async () => {
      await Cdp.deleteIdentity('crm_id');
      expect(mockNativeModule.cdpDeleteIdentity).toHaveBeenCalledWith(
        'crm_id',
        null
      );
    });

    it('forwards the value and rejects an empty type', async () => {
      await Cdp.deleteIdentity('email', 'u@x.com');
      expect(mockNativeModule.cdpDeleteIdentity).toHaveBeenCalledWith(
        'email',
        'u@x.com'
      );
      await expect(Cdp.deleteIdentity('')).rejects.toBeInstanceOf(TypeError);
    });
  });

  describe('linkIdentity (deprecated)', () => {
    it('still links, fire-and-forget, swallowing failures', async () => {
      mockNativeModule.cdpSetIdentity.mockRejectedValueOnce(new Error('x'));
      expect(() =>
        Cdp.linkIdentity('registered_user_id', 'user@example.com')
      ).not.toThrow();
      expect(mockNativeModule.cdpSetIdentity).toHaveBeenCalledWith(
        'registered_user_id',
        'user@example.com',
        false
      );
      await Promise.resolve();
    });
  });

  describe('getUserProfile', () => {
    it('parses the native JSON string including identityFresh', async () => {
      mockNativeModule.cdpGetUserProfile.mockResolvedValueOnce(
        '{"masterId":"550e8400-e29b-41d4-a716-446655440000","rfv":{"rfv":42,"r":3,"f":5,"v":7},"cohorts":[101,204],"identityFresh":true}'
      );
      const data = await Cdp.getUserProfile();
      expect(data.masterId).toBe('550e8400-e29b-41d4-a716-446655440000');
      expect(data.rfv).toEqual({ rfv: 42, r: 3, f: 5, v: 7 });
      expect(data.cohorts).toEqual([101, 204]);
      expect(data.identityFresh).toBe(true);
    });

    it('defaults identityFresh to false for an older native payload', async () => {
      mockNativeModule.cdpGetUserProfile.mockResolvedValueOnce(
        '{"masterId":null,"rfv":null,"cohorts":[]}'
      );
      const data = await Cdp.getUserProfile();
      expect(data).toEqual({
        masterId: null,
        rfv: null,
        cohorts: [],
        identityFresh: false,
      });
    });

    it('falls back to empty data when native returns an empty string', async () => {
      mockNativeModule.cdpGetUserProfile.mockResolvedValueOnce('');
      await expect(Cdp.getUserProfile()).resolves.toEqual({
        masterId: null,
        rfv: null,
        cohorts: [],
        identityFresh: false,
      });
    });

    it('getData (deprecated) delegates to getUserProfile', async () => {
      mockNativeModule.cdpGetUserProfile.mockResolvedValueOnce(
        '{"masterId":"m","rfv":null,"cohorts":[],"identityFresh":false}'
      );
      const data = await Cdp.getData();
      expect(data.masterId).toBe('m');
    });
  });

  describe('getMasterId', () => {
    it('resolves the native value', async () => {
      mockNativeModule.cdpGetMasterId.mockResolvedValueOnce('mid-1');
      await expect(Cdp.getMasterId()).resolves.toBe('mid-1');
    });

    it('resolves null when unresolved', async () => {
      mockNativeModule.cdpGetMasterId.mockResolvedValueOnce(null);
      await expect(Cdp.getMasterId()).resolves.toBeNull();
    });
  });

  describe('identity types & hashing', () => {
    it('exposes the well-known identity types without the phantom hash types', () => {
      expect(Cdp.IdentityTypes).toBe(CdpIdentityTypes);
      expect(Object.values(CdpIdentityTypes)).toHaveLength(16);
      expect(Object.values(CdpIdentityTypes)).not.toContain('email_hash');
      expect(Object.values(CdpIdentityTypes)).not.toContain('phone_hash');
      expect(CdpIdentityTypes.EMAIL_SHA256).toBe('email_sha256');
    });

    it('normalizes emails (trim + lower-case) and phones (trim only) locally', () => {
      expect(Cdp.normalizeEmail('  Foo@BAR.com ')).toBe('foo@bar.com');
      expect(Cdp.normalizePhone(' +34600111222 ')).toBe('+34600111222');
      expect(Cdp.normalizePhone('ABC')).toBe('ABC');
    });

    it('hashes through the native SDK', async () => {
      mockNativeModule.cdpHashEmail.mockResolvedValueOnce('0c7e');
      mockNativeModule.cdpHashPhone.mockResolvedValueOnce('cb24');
      await expect(Cdp.hashEmail(' Foo@Bar.com ')).resolves.toBe('0c7e');
      await expect(Cdp.hashPhone('+34600111222')).resolves.toBe('cb24');
      expect(mockNativeModule.cdpHashEmail).toHaveBeenCalledWith(
        ' Foo@Bar.com '
      );
    });
  });

  describe('trackConsent', () => {
    const recorded =
      '{"masterId":null,"consentId":"privacy","consentVersionId":"3","status":"accept","recorded":true,"stored":true}';

    it('serializes the decision with a string version and defaults metadata to {}', async () => {
      mockNativeModule.cdpTrackConsent.mockResolvedValueOnce(recorded);
      const result = await Cdp.trackConsent({
        consentId: 'privacy',
        versionId: 3,
        status: 'accepted',
      });
      expect(mockNativeModule.cdpTrackConsent).toHaveBeenCalledTimes(1);
      const payload = JSON.parse(
        mockNativeModule.cdpTrackConsent.mock.calls[0]?.[0] as string
      );
      expect(payload).toEqual({
        consentId: 'privacy',
        versionId: '3',
        status: 'accepted',
        metadata: {},
        email: null,
      });
      expect(result?.recorded).toBe(true);
      expect(result?.status).toBe('accept');
    });

    it('forwards metadata and email and accepts version 0', async () => {
      mockNativeModule.cdpTrackConsent.mockResolvedValueOnce(recorded);
      await Cdp.trackConsent({
        consentId: 'privacy',
        versionId: 0,
        status: 'rejected',
        metadata: { source: 'footer' },
        email: 'foo@bar.com',
      });
      const payload = JSON.parse(
        mockNativeModule.cdpTrackConsent.mock.calls[0]?.[0] as string
      );
      expect(payload.versionId).toBe('0');
      expect(payload.status).toBe('rejected');
      expect(payload.metadata).toEqual({ source: 'footer' });
      expect(payload.email).toBe('foo@bar.com');
    });

    it('resolves null without calling native when an id is missing', async () => {
      await expect(
        Cdp.trackConsent({ consentId: '', versionId: '1', status: 'accepted' })
      ).resolves.toBeNull();
      await expect(
        Cdp.trackConsent({
          consentId: 'privacy',
          versionId: undefined as unknown as string,
          status: 'accepted',
        })
      ).resolves.toBeNull();
      expect(mockNativeModule.cdpTrackConsent).not.toHaveBeenCalled();
    });

    it('resolves null when native reports a failure', async () => {
      mockNativeModule.cdpTrackConsent.mockResolvedValueOnce(null);
      await expect(
        Cdp.trackConsent({ consentId: 'privacy', versionId: '1', status: 'accepted' })
      ).resolves.toBeNull();
    });
  });

  describe('getConsent', () => {
    it('forwards the version as a string, or null when absent, and parses the definition', async () => {
      mockNativeModule.cdpGetConsent.mockResolvedValueOnce(
        JSON.stringify(definition)
      );
      const result = await Cdp.getConsent({ consentId: 'privacy', versionId: 3 });
      expect(mockNativeModule.cdpGetConsent).toHaveBeenCalledWith('privacy', '3');
      expect(result).toEqual(definition);

      mockNativeModule.cdpGetConsent.mockResolvedValueOnce(null);
      await expect(Cdp.getConsent({ consentId: 'privacy' })).resolves.toBeNull();
      expect(mockNativeModule.cdpGetConsent).toHaveBeenLastCalledWith(
        'privacy',
        null
      );
    });

    it('resolves null without native when consentId is missing', async () => {
      await expect(Cdp.getConsent({ consentId: '' })).resolves.toBeNull();
      expect(mockNativeModule.cdpGetConsent).not.toHaveBeenCalled();
    });
  });

  describe('hasConsent', () => {
    it('forwards consent id, version and email', async () => {
      mockNativeModule.cdpHasConsent.mockResolvedValueOnce(true);
      await expect(
        Cdp.hasConsent({ consentId: 'privacy', versionId: 3, email: 'foo@bar.com' })
      ).resolves.toBe(true);
      expect(mockNativeModule.cdpHasConsent).toHaveBeenCalledWith(
        'privacy',
        '3',
        'foo@bar.com'
      );
    });

    it('sends nulls for absent version and email, and is false without a consent id', async () => {
      mockNativeModule.cdpHasConsent.mockResolvedValueOnce(false);
      await expect(Cdp.hasConsent({ consentId: 'privacy' })).resolves.toBe(false);
      expect(mockNativeModule.cdpHasConsent).toHaveBeenCalledWith(
        'privacy',
        null,
        null
      );
      await expect(Cdp.hasConsent({ consentId: '' })).resolves.toBe(false);
      expect(mockNativeModule.cdpHasConsent).toHaveBeenCalledTimes(1);
    });
  });

  describe('segments', () => {
    it('addSegment forwards', () => {
      Cdp.addSegment('sports_fan');
      expect(mockNativeModule.cdpAddSegment).toHaveBeenCalledWith('sports_fan');
    });

    it('removeSegment forwards', () => {
      Cdp.removeSegment('churned');
      expect(mockNativeModule.cdpRemoveSegment).toHaveBeenCalledWith('churned');
    });

    it('setSegments forwards the array', () => {
      Cdp.setSegments(['a', 'b']);
      expect(mockNativeModule.cdpSetSegments).toHaveBeenCalledWith(['a', 'b']);
    });

    it('clearSegments forwards', () => {
      Cdp.clearSegments();
      expect(mockNativeModule.cdpClearSegments).toHaveBeenCalled();
    });

    it('getSegments resolves the native list', async () => {
      mockNativeModule.cdpGetSegments.mockResolvedValueOnce(['a', 'b']);
      await expect(Cdp.getSegments()).resolves.toEqual(['a', 'b']);
    });

    it('server segments and properties resolve the native values', async () => {
      mockNativeModule.cdpListServerSegments.mockResolvedValueOnce(['srv']);
      mockNativeModule.cdpGetServerSegments.mockResolvedValueOnce(['srv', 'x']);
      mockNativeModule.cdpListServerProperties.mockResolvedValueOnce({ a: '1' });
      mockNativeModule.cdpGetServerProperties.mockResolvedValueOnce({ b: '2' });
      await expect(Cdp.listServerSegments()).resolves.toEqual(['srv']);
      await expect(Cdp.getServerSegments()).resolves.toEqual(['srv', 'x']);
      await expect(Cdp.listServerProperties()).resolves.toEqual({ a: '1' });
      await expect(Cdp.getServerProperties()).resolves.toEqual({ b: '2' });
    });
  });

  describe('meters', () => {
    it('getMeterSnapshot parses a MeterState array', async () => {
      mockNativeModule.cdpGetMeterSnapshot.mockResolvedValueOnce(
        JSON.stringify([meteredWithThreshold, meterWithoutThreshold])
      );
      const meters = await Cdp.getMeterSnapshot();
      expect(meters).toHaveLength(2);
      expect(meters[0]?.threshold).toBe(5);
      expect(meters[0]?.reached).toBe(false);
      expect(meters[0]?.remaining).toBe(2);
    });

    it('preserves absent threshold trio for unconfigured meters', async () => {
      mockNativeModule.cdpListMeters.mockResolvedValueOnce(
        JSON.stringify([meterWithoutThreshold])
      );
      const meters = await Cdp.listMeters();
      expect(meters[0]).not.toHaveProperty('threshold');
      expect(meters[0]).not.toHaveProperty('reached');
      expect(meters[0]).not.toHaveProperty('remaining');
    });

    it('getMeterSnapshot returns [] for an empty native string', async () => {
      mockNativeModule.cdpGetMeterSnapshot.mockResolvedValueOnce('');
      await expect(Cdp.getMeterSnapshot()).resolves.toEqual([]);
    });

    it('getMeter resolves a single meter', async () => {
      mockNativeModule.cdpGetMeter.mockResolvedValueOnce(
        JSON.stringify(meteredWithThreshold)
      );
      const meter = await Cdp.getMeter('paywall');
      expect(mockNativeModule.cdpGetMeter).toHaveBeenCalledWith('paywall');
      expect(meter?.name).toBe('paywall');
    });

    it('getMeter resolves null when absent', async () => {
      mockNativeModule.cdpGetMeter.mockResolvedValueOnce(null);
      await expect(Cdp.getMeter('unknown')).resolves.toBeNull();
    });

    it('incrementMeter resolves the new state', async () => {
      mockNativeModule.cdpIncrementMeter.mockResolvedValueOnce(
        JSON.stringify({ ...meteredWithThreshold, count: 4, remaining: 1 })
      );
      const meter = await Cdp.incrementMeter('paywall');
      expect(meter?.count).toBe(4);
      expect(meter?.remaining).toBe(1);
    });

    it('incrementMeter rejects when the meter is not configured', async () => {
      mockNativeModule.cdpIncrementMeter.mockRejectedValueOnce(
        new Error('METER_NOT_FOUND')
      );
      await expect(Cdp.incrementMeter('ghost')).rejects.toThrow(
        'METER_NOT_FOUND'
      );
    });
  });
});
