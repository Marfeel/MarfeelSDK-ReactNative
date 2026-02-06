import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NativeModules } from 'react-native';
import { CompassTracking } from '../CompassTracking';
import { UserType, ConversionScope } from '../types';

const mockNativeModule = NativeModules.MarfeelSdk;

describe('CompassTracking', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('initialize', () => {
    it('calls native initialize with accountId', () => {
      CompassTracking.initialize('12345');
      expect(mockNativeModule.initialize).toHaveBeenCalledWith('12345', null);
    });

    it('calls native initialize with pageTechnology', () => {
      CompassTracking.initialize('12345', 11);
      expect(mockNativeModule.initialize).toHaveBeenCalledWith('12345', 11);
    });
  });

  describe('trackNewPage', () => {
    it('calls native trackNewPage with url only', () => {
      CompassTracking.trackNewPage('https://example.com');
      expect(mockNativeModule.trackNewPage).toHaveBeenCalledWith(
        'https://example.com',
        null,
        null
      );
    });

    it('calls native trackNewPage with rs option', () => {
      CompassTracking.trackNewPage('https://example.com', { rs: 'homepage' });
      expect(mockNativeModule.trackNewPage).toHaveBeenCalledWith(
        'https://example.com',
        null,
        'homepage'
      );
    });
  });

  describe('setUserType', () => {
    it('handles UserType.Anonymous', () => {
      CompassTracking.setUserType(UserType.Anonymous);
      expect(mockNativeModule.setUserType).toHaveBeenCalledWith(1);
    });

    it('handles UserType.Logged', () => {
      CompassTracking.setUserType(UserType.Logged);
      expect(mockNativeModule.setUserType).toHaveBeenCalledWith(2);
    });

    it('handles custom user type', () => {
      CompassTracking.setUserType({ custom: 99 });
      expect(mockNativeModule.setUserType).toHaveBeenCalledWith(99);
    });
  });

  describe('getRFV', () => {
    it('parses RFV response', async () => {
      const rfv = await CompassTracking.getRFV();
      expect(rfv).toEqual({ rfv: 0.5, r: 1, f: 2, v: 3 });
    });
  });

  describe('trackConversion', () => {
    it('calls with conversion only', () => {
      CompassTracking.trackConversion('signup');
      expect(mockNativeModule.trackConversion).toHaveBeenCalledWith(
        'signup',
        null,
        null,
        null,
        null,
        null
      );
    });

    it('calls with full options', () => {
      CompassTracking.trackConversion('purchase', {
        initiator: 'button',
        id: 'order-123',
        value: '99.99',
        meta: { currency: 'USD' },
        scope: ConversionScope.User,
      });
      expect(mockNativeModule.trackConversion).toHaveBeenCalledWith(
        'purchase',
        'button',
        'order-123',
        '99.99',
        { currency: 'USD' },
        'user'
      );
    });
  });
});
