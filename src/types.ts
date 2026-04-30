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
