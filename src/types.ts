export enum UserType {
  Anonymous = 1,
  Logged = 2,
  Paid = 3,
}

export interface CustomUserType {
  custom: number;
}

export type UserTypeValue = UserType | CustomUserType;

export enum ConversionScope {
  User = 'user',
  Session = 'session',
  Page = 'page',
}

export interface ConversionOptions {
  initiator?: string;
  id?: string;
  value?: string;
  meta?: Record<string, string>;
  scope?: ConversionScope;
}

export enum MultimediaType {
  Audio = 'audio',
  Video = 'video',
}

export enum MultimediaEvent {
  Play = 'play',
  Pause = 'pause',
  End = 'end',
  UpdateCurrentTime = 'updateCurrentTime',
  AdPlay = 'adPlay',
  Mute = 'mute',
  Unmute = 'unmute',
  FullScreen = 'fullscreen',
  BackScreen = 'backscreen',
  EnterViewport = 'enterViewport',
  LeaveViewport = 'leaveViewport',
}

export interface MultimediaMetadata {
  isLive?: boolean;
  title?: string;
  description?: string;
  url?: string;
  thumbnail?: string;
  authors?: string;
  publishTime?: number;
  duration?: number;
}

export interface RFV {
  rfv: number;
  r: number;
  f: number;
  v: number;
}

export interface CdpRfv {
  rfv: number;
  r: number;
  f: number;
  v: number;
}

export interface CdpData {
  masterId: string | null;
  rfv: CdpRfv | null;
  cohorts: number[];
  /** True only when this app process resolved the identity itself; a warm cache never counts. */
  identityFresh: boolean;
}

/**
 * The well-known identity types for `Cdp.setIdentity` / `Cdp.deleteIdentity`. The set is
 * open (sites register their own), so this is documentation, never a validation list.
 * Stable types make the user registered and their data permanent; device-bound types
 * leave them anonymous, aged out 180 days after the last write. `email_hash` /
 * `phone_hash` are deliberately absent: they create a parallel user that never merges
 * with `*_sha256`.
 */
export const CdpIdentityTypes = Object.freeze({
  EMAIL: 'email',
  EMAIL_SHA256: 'email_sha256',
  PHONE: 'phone',
  PHONE_SHA256: 'phone_sha256',
  EXTERNAL_ID: 'external_id',
  CUSTOMER_ID: 'customer_id',
  REGISTERED_USER_ID: 'registered_user_id',

  LOGIN_ID: 'login_id',
  CRM_ID: 'crm_id',
  COOKIE: 'cookie',
  DEVICE_ID: 'device_id',
  MAID: 'maid',
  IDFA: 'idfa',
  IDFV: 'idfv',
  RAMPID: 'rampid',
  PUSH_TOKEN: 'push_token',
} as const);

export type CdpIdentityType =
  | (typeof CdpIdentityTypes)[keyof typeof CdpIdentityTypes]
  | (string & {});

export type CdpConsentStatus = 'accepted' | 'rejected';

export interface CdpConsent {
  consentId: string;
  /** The version's id from CDP > Settings > Consents. Opaque: sent verbatim (0 is valid). */
  versionId: string | number;
  status: CdpConsentStatus;
  metadata?: Record<string, string>;
  /** Linked to the master when one exists; otherwise the subject. Hashed on the device before it leaves. */
  email?: string;
}

export interface CdpConsentRef {
  consentId: string;
  /** Absent → the consent's default version, as configured in Compass. */
  versionId?: string | number;
}

export interface CdpConsentQuery {
  consentId: string;
  /** When given, only an accept at exactly this version counts. Absent → any accepted version. */
  versionId?: string | number;
  /** Sent alongside the master when both exist, so an email accepted elsewhere answers before it is linked here. */
  email?: string;
}

/** Carried through verbatim from the server; `form-submit` means show no box at all. */
export type CdpConsentAcceptMethod =
  | 'check-box'
  | 'pre-checked'
  | 'form-submit'
  | (string & {});

/** Pair `if-not-accepted` with `Cdp.hasConsent` — this is config, not a verdict. */
export type CdpConsentShowPolicy = 'always' | 'if-not-accepted';

export interface CdpConsentVersion {
  versionId: string;
  label: string;
  date: string | null;
  displayPrompt: string | null;
  errorMessage: string | null;
  metadata: Record<string, string>;
}

export interface CdpConsentDefinition {
  consentId: string;
  name: string;
  purpose: string | null;
  mandatory: boolean;
  acceptMethod: CdpConsentAcceptMethod;
  showPolicy: CdpConsentShowPolicy;
  version: CdpConsentVersion | null;
}

export interface CdpConsentRecordResponse {
  /** The canonical master; may differ from the device's after a merge. Null for an anonymous decision. */
  masterId: string | null;
  consentId: string | null;
  consentVersionId: string | null;
  /** The server's short vocabulary: `accept` / `reject`. */
  status: string | null;
  recorded: boolean;
  stored: boolean;
}

export interface MeterWindow {
  duration: string;
  period: string;
  tz: string;
}

export interface MeterState {
  name: string;
  count: number;
  threshold?: number;
  reached?: boolean;
  remaining?: number;
  startedAt?: string;
  expiresAt?: string;
  window: MeterWindow;
}

export interface TrackingOptions {
  rs?: string;
}

export enum ExperienceType {
  Inline = 'inline',
  Flowcards = 'flowcards',
  Compass = 'compass',
  AdManager = 'adManager',
  AffiliationEnhancer = 'affiliationEnhancer',
  Conversions = 'conversions',
  Content = 'content',
  Experiments = 'experiments',
  Experimentation = 'experimentation',
  Recirculation = 'recirculation',
  GoalTracking = 'goalTracking',
  Ecommerce = 'ecommerce',
  Multimedia = 'multimedia',
  Piano = 'piano',
  AppBanner = 'appBanner',
  Unknown = 'unknown',
}

export enum ExperienceFamily {
  Twitter = 'twitterexperience',
  Facebook = 'facebookexperience',
  Youtube = 'youtubeexperience',
  Recommender = 'recommenderexperience',
  Telegram = 'telegramexperience',
  Gathering = 'gatheringexperience',
  Affiliate = 'affiliateexperience',
  Podcast = 'podcastexperience',
  Experimentation = 'experimentsexperience',
  Widget = 'widgetexperience',
  MarfeelPass = 'passexperience',
  Script = 'scriptexperience',
  Paywall = 'paywallexperience',
  MarfeelSocial = 'marfeelsocial',
  Unknown = 'unknown',
}

export enum ExperienceContentType {
  TextHTML = 'TextHTML',
  Json = 'Json',
  AMP = 'AMP',
  WidgetProvider = 'WidgetProvider',
  AdServer = 'AdServer',
  Container = 'Container',
  Unknown = 'Unknown',
}

export interface ExperienceSelector {
  selector: string;
  strategy: string;
}

export interface ExperienceFilter {
  key: string;
  operator: string;
  values: string[];
}

export interface RecirculationLink {
  url: string;
  position: number;
}

export interface Experience {
  id: string;
  name: string;
  type: ExperienceType;
  family: ExperienceFamily | null;
  placement: string | null;
  contentUrl: string | null;
  contentType: ExperienceContentType;
  features: Record<string, unknown> | null;
  strategy: string | null;
  selectors: ExperienceSelector[] | null;
  filters: ExperienceFilter[] | null;
  rawJson: Record<string, unknown>;
  resolvedContent: string | null;
}

export interface FetchExperiencesOptions {
  filterByType?: ExperienceType;
  filterByFamily?: ExperienceFamily;
  resolve?: boolean;
  url?: string;
}
