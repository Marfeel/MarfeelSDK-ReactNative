import { NativeMarfeelSdk } from './NativeMarfeelSdk';
import type { RecirculationLink } from './types';

export const Recirculation = {
  trackEligible(name: string, links: RecirculationLink[]): void {
    NativeMarfeelSdk.recirculationTrackEligible(name, links);
  },

  trackImpression(
    name: string,
    linkOrLinks: RecirculationLink | RecirculationLink[]
  ): void {
    const links = Array.isArray(linkOrLinks) ? linkOrLinks : [linkOrLinks];
    NativeMarfeelSdk.recirculationTrackImpression(name, links);
  },

  trackClick(name: string, link: RecirculationLink): void {
    NativeMarfeelSdk.recirculationTrackClick(name, link);
  },
};
