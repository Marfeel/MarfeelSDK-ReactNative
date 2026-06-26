import { NativeMarfeelSdk } from './NativeMarfeelSdk';
import type { CdpData, MeterState } from './types';

const EMPTY_CDP_DATA: CdpData = {
  masterId: null,
  rfv: null,
  cohorts: [],
};

function parseMeters(json: string | null): MeterState[] {
  if (!json) return [];
  return JSON.parse(json) as MeterState[];
}

export const Cdp = {
  linkIdentity(
    type: string,
    value: string,
    isDeterministic = false
  ): void {
    NativeMarfeelSdk.cdpLinkIdentity(type, value, isDeterministic);
  },

  async getData(): Promise<CdpData> {
    const json = await NativeMarfeelSdk.cdpGetData();
    if (!json) return EMPTY_CDP_DATA;
    return JSON.parse(json) as CdpData;
  },

  getMasterId(): Promise<string | null> {
    return NativeMarfeelSdk.cdpGetMasterId();
  },

  addSegment(segment: string): void {
    NativeMarfeelSdk.cdpAddSegment(segment);
  },

  removeSegment(segment: string): void {
    NativeMarfeelSdk.cdpRemoveSegment(segment);
  },

  setSegments(segments: string[]): void {
    NativeMarfeelSdk.cdpSetSegments(segments);
  },

  clearSegments(): void {
    NativeMarfeelSdk.cdpClearSegments();
  },

  getSegments(): Promise<string[]> {
    return NativeMarfeelSdk.cdpGetSegments();
  },

  async getMeterSnapshot(): Promise<MeterState[]> {
    const json = await NativeMarfeelSdk.cdpGetMeterSnapshot();
    return parseMeters(json);
  },

  async getMeter(name: string): Promise<MeterState | null> {
    const json = await NativeMarfeelSdk.cdpGetMeter(name);
    if (!json) return null;
    return JSON.parse(json) as MeterState;
  },

  async listMeters(): Promise<MeterState[]> {
    const json = await NativeMarfeelSdk.cdpListMeters();
    return parseMeters(json);
  },

  async incrementMeter(name: string): Promise<MeterState | null> {
    const json = await NativeMarfeelSdk.cdpIncrementMeter(name);
    if (!json) return null;
    return JSON.parse(json) as MeterState;
  },
};
