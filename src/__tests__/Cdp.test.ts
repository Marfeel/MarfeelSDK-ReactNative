import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NativeModules } from 'react-native';
import { Cdp } from '../Cdp';
import type { MeterState } from '../types';

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

describe('Cdp', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('linkIdentity', () => {
    it('defaults isDeterministic to false', () => {
      Cdp.linkIdentity('registered_user_id', 'user@example.com');
      expect(mockNativeModule.cdpLinkIdentity).toHaveBeenCalledWith(
        'registered_user_id',
        'user@example.com',
        false
      );
    });

    it('forwards an explicit isDeterministic flag', () => {
      Cdp.linkIdentity('crm_id', 'abc', true);
      expect(mockNativeModule.cdpLinkIdentity).toHaveBeenCalledWith(
        'crm_id',
        'abc',
        true
      );
    });
  });

  describe('getData', () => {
    it('parses the native JSON string', async () => {
      mockNativeModule.cdpGetData.mockResolvedValueOnce(
        '{"masterId":"550e8400-e29b-41d4-a716-446655440000","rfv":{"rfv":42,"r":3,"f":5,"v":7},"cohorts":[101,204]}'
      );
      const data = await Cdp.getData();
      expect(data.masterId).toBe('550e8400-e29b-41d4-a716-446655440000');
      expect(data.rfv).toEqual({ rfv: 42, r: 3, f: 5, v: 7 });
      expect(data.cohorts).toEqual([101, 204]);
    });

    it('handles the unknown identity (null rfv, empty cohorts)', async () => {
      mockNativeModule.cdpGetData.mockResolvedValueOnce(
        '{"masterId":null,"rfv":null,"cohorts":[]}'
      );
      const data = await Cdp.getData();
      expect(data).toEqual({ masterId: null, rfv: null, cohorts: [] });
    });

    it('falls back to empty data when native returns an empty string', async () => {
      mockNativeModule.cdpGetData.mockResolvedValueOnce('');
      const data = await Cdp.getData();
      expect(data).toEqual({ masterId: null, rfv: null, cohorts: [] });
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
