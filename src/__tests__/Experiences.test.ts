import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NativeModules } from 'react-native';
import { Experiences } from '../Experiences';
import {
  ExperienceContentType,
  ExperienceFamily,
  ExperienceType,
  type Experience,
} from '../types';

const mockNativeModule = NativeModules.MarfeelSdk;

const fixtureExperience: Experience = {
  id: 'IL_abc',
  name: 'experience-a',
  type: ExperienceType.Inline,
  family: ExperienceFamily.Recommender,
  placement: 'top',
  contentUrl: 'https://flowcards.mrf.io/x?id=IL_abc',
  contentType: ExperienceContentType.TextHTML,
  features: { foo: 'bar' },
  strategy: 'default',
  selectors: [{ selector: '#sel', strategy: 'css' }],
  filters: [{ key: 'mrf_exp_g1', operator: 'eq', values: ['v1'] }],
  rawJson: { id: 'IL_abc' },
  resolvedContent: null,
};

describe('Experiences', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('addTargeting', () => {
    it('forwards key/value', () => {
      Experiences.addTargeting('section', 'home');
      expect(mockNativeModule.experiencesAddTargeting).toHaveBeenCalledWith(
        'section',
        'home'
      );
    });
  });

  describe('fetchExperiences', () => {
    it('forwards null filters when no options are given', async () => {
      mockNativeModule.experiencesFetch.mockResolvedValueOnce('[]');
      await Experiences.fetchExperiences();
      expect(mockNativeModule.experiencesFetch).toHaveBeenCalledWith(
        null,
        null,
        false,
        null
      );
    });

    it('forwards typed filters and resolve flag', async () => {
      mockNativeModule.experiencesFetch.mockResolvedValueOnce('[]');
      await Experiences.fetchExperiences({
        filterByType: ExperienceType.AdManager,
        filterByFamily: ExperienceFamily.Recommender,
        resolve: true,
        url: 'https://example.com/page',
      });
      expect(mockNativeModule.experiencesFetch).toHaveBeenCalledWith(
        'adManager',
        'recommenderexperience',
        true,
        'https://example.com/page'
      );
    });

    it('parses native JSON response into typed Experience array', async () => {
      mockNativeModule.experiencesFetch.mockResolvedValueOnce(
        JSON.stringify([fixtureExperience])
      );
      const result = await Experiences.fetchExperiences();
      expect(result).toHaveLength(1);
      expect(result[0]?.id).toBe('IL_abc');
      expect(result[0]?.type).toBe(ExperienceType.Inline);
      expect(result[0]?.family).toBe(ExperienceFamily.Recommender);
    });

    it('returns an empty array when native returns an empty string', async () => {
      mockNativeModule.experiencesFetch.mockResolvedValueOnce('');
      const result = await Experiences.fetchExperiences();
      expect(result).toEqual([]);
    });
  });

  describe('tracking — accepts both Experience object and id string', () => {
    it('trackImpression with Experience object extracts id', () => {
      const links = [{ url: 'https://a.com', position: 0 }];
      Experiences.trackImpression(fixtureExperience, links);
      expect(mockNativeModule.experiencesTrackImpression).toHaveBeenCalledWith(
        'IL_abc',
        links
      );
    });

    it('trackImpression with id string passes through', () => {
      const links = [{ url: 'https://a.com', position: 0 }];
      Experiences.trackImpression('IL_xyz', links);
      expect(mockNativeModule.experiencesTrackImpression).toHaveBeenCalledWith(
        'IL_xyz',
        links
      );
    });

    it('trackImpression with single link wraps into an array', () => {
      const link = { url: 'https://a.com', position: 0 };
      Experiences.trackImpression(fixtureExperience, link);
      expect(mockNativeModule.experiencesTrackImpression).toHaveBeenCalledWith(
        'IL_abc',
        [link]
      );
    });

    it('trackEligible forwards id and links', () => {
      const links = [{ url: 'https://a.com', position: 0 }];
      Experiences.trackEligible(fixtureExperience, links);
      expect(mockNativeModule.experiencesTrackEligible).toHaveBeenCalledWith(
        'IL_abc',
        links
      );
    });

    it('trackClick forwards id and single link', () => {
      const link = { url: 'https://a.com', position: 0 };
      Experiences.trackClick(fixtureExperience, link);
      expect(mockNativeModule.experiencesTrackClick).toHaveBeenCalledWith(
        'IL_abc',
        link
      );
    });

    it('trackClose forwards id only', () => {
      Experiences.trackClose(fixtureExperience);
      expect(mockNativeModule.experiencesTrackClose).toHaveBeenCalledWith(
        'IL_abc'
      );
    });

    it('resolveContent forwards id and resolves to native value', async () => {
      mockNativeModule.experiencesResolveContent.mockResolvedValueOnce(
        '<html>x</html>'
      );
      const content = await Experiences.resolveContent(fixtureExperience);
      expect(mockNativeModule.experiencesResolveContent).toHaveBeenCalledWith(
        'IL_abc'
      );
      expect(content).toBe('<html>x</html>');
    });
  });

  describe('QA / debug methods', () => {
    it('clearFrequencyCaps forwards', () => {
      Experiences.clearFrequencyCaps();
      expect(
        mockNativeModule.experiencesClearFrequencyCaps
      ).toHaveBeenCalled();
    });

    it('getFrequencyCapCounts forwards id and returns map', async () => {
      mockNativeModule.experiencesGetFrequencyCapCounts.mockResolvedValueOnce({
        l: 5,
        d: 2,
      });
      const counts = await Experiences.getFrequencyCapCounts('IL_abc');
      expect(
        mockNativeModule.experiencesGetFrequencyCapCounts
      ).toHaveBeenCalledWith('IL_abc');
      expect(counts).toEqual({ l: 5, d: 2 });
    });

    it('getFrequencyCapConfig returns map', async () => {
      mockNativeModule.experiencesGetFrequencyCapConfig.mockResolvedValueOnce({
        IL_abc: ['l', 'd'],
      });
      const config = await Experiences.getFrequencyCapConfig();
      expect(config).toEqual({ IL_abc: ['l', 'd'] });
    });

    it('getExperimentAssignments returns map', async () => {
      mockNativeModule.experiencesGetExperimentAssignments.mockResolvedValueOnce(
        { g1: 'v1' }
      );
      const a = await Experiences.getExperimentAssignments();
      expect(a).toEqual({ g1: 'v1' });
    });

    it('setExperimentAssignment forwards groupId and variantId', () => {
      Experiences.setExperimentAssignment('g1', 'v2');
      expect(
        mockNativeModule.experiencesSetExperimentAssignment
      ).toHaveBeenCalledWith('g1', 'v2');
    });

    it('clearExperimentAssignments forwards', () => {
      Experiences.clearExperimentAssignments();
      expect(
        mockNativeModule.experiencesClearExperimentAssignments
      ).toHaveBeenCalled();
    });

    it('clearReadEditorials forwards', () => {
      Experiences.clearReadEditorials();
      expect(
        mockNativeModule.experiencesClearReadEditorials
      ).toHaveBeenCalled();
    });

    it('getReadEditorials returns array', async () => {
      mockNativeModule.experiencesGetReadEditorials.mockResolvedValueOnce([
        '120',
        '130',
      ]);
      const ids = await Experiences.getReadEditorials();
      expect(ids).toEqual(['120', '130']);
    });
  });
});
