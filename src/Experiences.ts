import { NativeMarfeelSdk } from './NativeMarfeelSdk';
import type {
  Experience,
  FetchExperiencesOptions,
  RecirculationLink,
} from './types';

type ExperienceRef = Experience | string;

const idOf = (ref: ExperienceRef): string =>
  typeof ref === 'string' ? ref : ref.id;

export const Experiences = {
  addTargeting(key: string, value: string): void {
    NativeMarfeelSdk.experiencesAddTargeting(key, value);
  },

  async fetchExperiences(
    options?: FetchExperiencesOptions
  ): Promise<Experience[]> {
    const json = await NativeMarfeelSdk.experiencesFetch(
      options?.filterByType ?? null,
      options?.filterByFamily ?? null,
      options?.resolve ?? false,
      options?.url ?? null
    );
    if (!json) return [];
    return JSON.parse(json) as Experience[];
  },

  resolveContent(experience: ExperienceRef): Promise<string | null> {
    return NativeMarfeelSdk.experiencesResolveContent(idOf(experience));
  },

  trackEligible(experience: ExperienceRef, links: RecirculationLink[]): void {
    NativeMarfeelSdk.experiencesTrackEligible(idOf(experience), links);
  },

  trackImpression(
    experience: ExperienceRef,
    linkOrLinks: RecirculationLink | RecirculationLink[]
  ): void {
    const links = Array.isArray(linkOrLinks) ? linkOrLinks : [linkOrLinks];
    NativeMarfeelSdk.experiencesTrackImpression(idOf(experience), links);
  },

  trackClick(experience: ExperienceRef, link: RecirculationLink): void {
    NativeMarfeelSdk.experiencesTrackClick(idOf(experience), link);
  },

  trackClose(experience: ExperienceRef): void {
    NativeMarfeelSdk.experiencesTrackClose(idOf(experience));
  },

  clearFrequencyCaps(): void {
    NativeMarfeelSdk.experiencesClearFrequencyCaps();
  },

  getFrequencyCapCounts(
    experienceId: string
  ): Promise<Record<string, number>> {
    return NativeMarfeelSdk.experiencesGetFrequencyCapCounts(experienceId);
  },

  getFrequencyCapConfig(): Promise<Record<string, string[]>> {
    return NativeMarfeelSdk.experiencesGetFrequencyCapConfig();
  },

  clearReadEditorials(): void {
    NativeMarfeelSdk.experiencesClearReadEditorials();
  },

  getReadEditorials(): Promise<string[]> {
    return NativeMarfeelSdk.experiencesGetReadEditorials();
  },

  getExperimentAssignments(): Promise<Record<string, string>> {
    return NativeMarfeelSdk.experiencesGetExperimentAssignments();
  },

  setExperimentAssignment(groupId: string, variantId: string): void {
    NativeMarfeelSdk.experiencesSetExperimentAssignment(groupId, variantId);
  },

  clearExperimentAssignments(): void {
    NativeMarfeelSdk.experiencesClearExperimentAssignments();
  },
};
