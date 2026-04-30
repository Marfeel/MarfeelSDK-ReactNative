import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NativeModules } from 'react-native';
import { Recirculation } from '../Recirculation';

const mockNativeModule = NativeModules.MarfeelSdk;

describe('Recirculation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('trackEligible', () => {
    it('forwards name and links array', () => {
      const links = [
        { url: 'https://a.com', position: 0 },
        { url: 'https://b.com', position: 1 },
      ];
      Recirculation.trackEligible('module-a', links);
      expect(mockNativeModule.recirculationTrackEligible).toHaveBeenCalledWith(
        'module-a',
        links
      );
    });
  });

  describe('trackImpression', () => {
    it('forwards a links array as-is', () => {
      const links = [{ url: 'https://a.com', position: 0 }];
      Recirculation.trackImpression('module-a', links);
      expect(mockNativeModule.recirculationTrackImpression).toHaveBeenCalledWith(
        'module-a',
        links
      );
    });

    it('wraps a single link into an array before forwarding', () => {
      const link = { url: 'https://a.com', position: 0 };
      Recirculation.trackImpression('module-a', link);
      expect(mockNativeModule.recirculationTrackImpression).toHaveBeenCalledWith(
        'module-a',
        [link]
      );
    });
  });

  describe('trackClick', () => {
    it('forwards a single link', () => {
      const link = { url: 'https://a.com', position: 2 };
      Recirculation.trackClick('module-a', link);
      expect(mockNativeModule.recirculationTrackClick).toHaveBeenCalledWith(
        'module-a',
        link
      );
    });
  });
});
