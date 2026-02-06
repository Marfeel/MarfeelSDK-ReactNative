import { NativeMarfeelSdk } from './NativeMarfeelSdk';
import type { MultimediaMetadata } from './types';
import { MultimediaEvent, MultimediaType } from './types';

export const MultimediaTracking = {
  initializeItem(
    id: string,
    provider: string,
    providerId: string,
    type: MultimediaType,
    metadata?: MultimediaMetadata
  ): void {
    NativeMarfeelSdk.initializeMultimediaItem(
      id,
      provider,
      providerId,
      type,
      JSON.stringify(metadata ?? {})
    );
  },

  registerEvent(id: string, event: MultimediaEvent, eventTime: number): void {
    NativeMarfeelSdk.registerMultimediaEvent(id, event, eventTime);
  },
};
