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
