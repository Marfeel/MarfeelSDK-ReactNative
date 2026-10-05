import { NativeMarfeelSdk } from './NativeMarfeelSdk';
import type {
  CdpConsent,
  CdpConsentDefinition,
  CdpConsentQuery,
  CdpConsentRecordResponse,
  CdpConsentRef,
  CdpData,
  MeterState,
} from './types';
import { CdpIdentityTypes } from './types';

const EMPTY_CDP_DATA: CdpData = {
  masterId: null,
  rfv: null,
  cohorts: [],
  identityFresh: false,
};

function parseMeters(json: string | null): MeterState[] {
  if (!json) return [];
  return JSON.parse(json) as MeterState[];
}

function parseOrNull<T>(json: string | null): T | null {
  if (!json) return null;
  return JSON.parse(json) as T;
}

const hasVersion = (versionId: string | number | undefined): boolean =>
  versionId !== undefined && versionId !== null;

const versionOrNull = (versionId: string | number | undefined): string | null =>
  hasVersion(versionId) ? String(versionId) : null;

/**
 * Everything here is inert (`null` / `false` / empty answers, no network) unless the
 * SDK was initialized with `enableCdp: true`. Identity calls are additionally gated on
 * personalization consent (`CompassTracking.setConsent`); the publisher-consent calls
 * (`trackConsent`, `getConsent`, `hasConsent`) deliberately are not.
 */
export const Cdp = {
  IdentityTypes: CdpIdentityTypes,

  /**
   * Link an external identifier to the current visitor and adopt the master the CDP
   * resolves it to. Resolves once the link round-trip completes (or is skipped for lack
   * of consent). Rejects with a `TypeError` on an empty type or value instead of posting
   * them: the failed request would cache empty rfv/cohorts over the real ones.
   */
  setIdentity(
    type: string,
    value: string,
    isDeterministic = false
  ): Promise<void> {
    if (!type) return Promise.reject(new TypeError('Cdp.setIdentity: type is required'));
    if (value === null || value === undefined || value === '') {
      return Promise.reject(new TypeError('Cdp.setIdentity: value is required'));
    }
    return NativeMarfeelSdk.cdpSetIdentity(type, value, isDeterministic);
  },

  /**
   * Unlink an identity from the current master. Without a `value`, every identity of
   * `type` the master owns is unlinked. Rejects with a `TypeError` on an empty type.
   */
  deleteIdentity(type: string, value?: string): Promise<void> {
    if (!type) return Promise.reject(new TypeError('Cdp.deleteIdentity: type is required'));
    return NativeMarfeelSdk.cdpDeleteIdentity(type, value ?? null);
  },

  /** @deprecated Use `setIdentity`. Fire-and-forget; the returned promise is not surfaced. */
  linkIdentity(type: string, value: string, isDeterministic = false): void {
    NativeMarfeelSdk.cdpSetIdentity(type, value, isDeterministic).catch(
      () => undefined
    );
  },

  /** The CDP's contribution to a beacon: master_id, read-only rfv/cohorts and `identityFresh`. */
  async getUserProfile(): Promise<CdpData> {
    const json = await NativeMarfeelSdk.cdpGetUserProfile();
    if (!json) return EMPTY_CDP_DATA;
    return { ...EMPTY_CDP_DATA, ...(JSON.parse(json) as Partial<CdpData>) };
  },

  /** @deprecated Use `getUserProfile`. */
  getData(): Promise<CdpData> {
    return Cdp.getUserProfile();
  },

  getMasterId(): Promise<string | null> {
    return NativeMarfeelSdk.cdpGetMasterId();
  },

  /**
   * Record that the visitor accepted or rejected a publisher consent (a privacy policy, a
   * newsletter opt-in). Not gated on personalization consent. Recorded under the current
   * master when one exists; an anonymous decision is remembered on the device and
   * replayed once a master exists. Resolves `null` on failure, when CDP is disabled, or
   * when `consentId` / `versionId` is missing.
   */
  async trackConsent(
    decision: CdpConsent
  ): Promise<CdpConsentRecordResponse | null> {
    if (!decision?.consentId || !hasVersion(decision.versionId)) return null;
    const payload = {
      consentId: decision.consentId,
      versionId: String(decision.versionId),
      status: decision.status,
      metadata: decision.metadata ?? {},
      email: decision.email ?? null,
    };
    const json = await NativeMarfeelSdk.cdpTrackConsent(JSON.stringify(payload));
    return parseOrNull<CdpConsentRecordResponse>(json);
  },

  /** Read a consent's definition from the catalog. `null` when unknown, on failure, or when CDP is disabled. */
  async getConsent(ref: CdpConsentRef): Promise<CdpConsentDefinition | null> {
    if (!ref?.consentId) return null;
    const json = await NativeMarfeelSdk.cdpGetConsent(
      ref.consentId,
      versionOrNull(ref.versionId)
    );
    return parseOrNull<CdpConsentDefinition>(json);
  },

  /**
   * Whether the visitor has accepted the consent (at exactly `versionId` when given).
   * `false` — never `null` — on failure and when CDP is disabled. Answered from the
   * device's memory when it has neither a master nor an email to ask with.
   */
  async hasConsent(query: CdpConsentQuery): Promise<boolean> {
    if (!query?.consentId) return false;
    return NativeMarfeelSdk.cdpHasConsent(
      query.consentId,
      versionOrNull(query.versionId),
      query.email ?? null
    );
  },

  /** `trim` + lower-case, the server's rule for emails. */
  normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  },

  /** `trim` only — never case-folded; `+34600111222` and `600111222` stay two users. */
  normalizePhone(phone: string): string {
    return phone.trim();
  },

  /** SHA-256 hex of `normalizeEmail(email)`; send under `CdpIdentityTypes.EMAIL_SHA256`. */
  hashEmail(email: string): Promise<string> {
    return NativeMarfeelSdk.cdpHashEmail(email);
  },

  /** SHA-256 hex of `normalizePhone(phone)`; send under `CdpIdentityTypes.PHONE_SHA256`. */
  hashPhone(phone: string): Promise<string> {
    return NativeMarfeelSdk.cdpHashPhone(phone);
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

  /** Server Segments (asserted by the CDP, not by this device) known right now, without resolving. */
  listServerSegments(): Promise<string[]> {
    return NativeMarfeelSdk.cdpListServerSegments();
  },

  /** Server Segments after an identity resolve. */
  getServerSegments(): Promise<string[]> {
    return NativeMarfeelSdk.cdpGetServerSegments();
  },

  /** Server Properties (computed by the CDP) known right now, without resolving. */
  listServerProperties(): Promise<Record<string, string>> {
    return NativeMarfeelSdk.cdpListServerProperties();
  },

  /** Server Properties after an identity resolve. */
  getServerProperties(): Promise<Record<string, string>> {
    return NativeMarfeelSdk.cdpGetServerProperties();
  },

  async getMeterSnapshot(): Promise<MeterState[]> {
    const json = await NativeMarfeelSdk.cdpGetMeterSnapshot();
    return parseMeters(json);
  },

  async getMeter(name: string): Promise<MeterState | null> {
    const json = await NativeMarfeelSdk.cdpGetMeter(name);
    return parseOrNull<MeterState>(json);
  },

  async listMeters(): Promise<MeterState[]> {
    const json = await NativeMarfeelSdk.cdpListMeters();
    return parseMeters(json);
  },

  async incrementMeter(name: string): Promise<MeterState | null> {
    const json = await NativeMarfeelSdk.cdpIncrementMeter(name);
    return parseOrNull<MeterState>(json);
  },
};
