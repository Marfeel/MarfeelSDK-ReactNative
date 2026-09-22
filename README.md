# @marfeel/react-native-sdk

React Native bridge for the Marfeel Compass SDK. Provides analytics tracking capabilities for React Native apps.

## Installation

```bash
npm install @marfeel/react-native-sdk
# or
yarn add @marfeel/react-native-sdk
```

### iOS

```bash
cd ios && pod install
```

### Android

No additional setup required. Autolinking handles everything.

## Usage

### Initialization

Initialize the SDK once at app startup:

```typescript
import { CompassTracking } from '@marfeel/react-native-sdk';

// In your App.tsx or entry point
useEffect(() => {
  CompassTracking.initialize('YOUR_ACCOUNT_ID');
}, []);
```

To opt in to the CDP subsystem (see [CDP](#cdp)), pass `enableCdp`:

```typescript
CompassTracking.initialize('YOUR_ACCOUNT_ID', undefined, { enableCdp: true });
```

### Page Tracking

```typescript
import { CompassTracking, CompassScrollView } from '@marfeel/react-native-sdk';

function ArticleScreen({ article }) {
  useEffect(() => {
    CompassTracking.trackNewPage(article.url);
    return () => CompassTracking.stopTracking();
  }, [article.url]);

  return (
    <CompassScrollView>
      <Text>{article.title}</Text>
      <Text>{article.body}</Text>
    </CompassScrollView>
  );
}
```

### Screen Tracking (without URL)

```typescript
CompassTracking.trackScreen('HomeScreen');
```

### User Management

```typescript
import { CompassTracking, UserType } from '@marfeel/react-native-sdk';

CompassTracking.setSiteUserId('user-123');
CompassTracking.setUserType(UserType.Logged);

const userId = await CompassTracking.getUserId();
const sessionId = await CompassTracking.getSessionId();
const rfv = await CompassTracking.getRFV();
```

### Conversions

```typescript
import { CompassTracking, ConversionScope } from '@marfeel/react-native-sdk';

// Simple conversion
CompassTracking.trackConversion('signup');

// With options
CompassTracking.trackConversion('purchase', {
  id: 'order-123',
  value: '99.99',
  meta: { currency: 'USD' },
  scope: ConversionScope.User,
});
```

### Custom Variables

```typescript
CompassTracking.setPageVar('author', 'John Doe');
CompassTracking.setPageMetric('wordCount', 1500);
CompassTracking.setSessionVar('campaign', 'summer2024');
CompassTracking.setUserVar('preferredLanguage', 'en');
```

### User Segments

```typescript
CompassTracking.addUserSegment('premium');
CompassTracking.setUserSegments(['premium', 'newsletter']);
CompassTracking.removeUserSegment('premium');
CompassTracking.clearUserSegments();

const segments = await CompassTracking.getUserSegments();       // as a beacon sends them
const current = await CompassTracking.getUserSegmentsAsync();   // after resolving identity
```

`getUserSegments` returns the device-owned segments unioned with the Server Segments the
CDP asserts (server first, deduplicated) and capped at 100. When the union overflows, the
user var `mrf_tooManySegments` is set and device-owned segments are the ones dropped.
`getUserVars` / `getUserVarsAsync` likewise return the device-owned vars followed by the
CDP's Server Properties (device-owned wins on a collision).

### Sign-out

```typescript
await CompassTracking.resetUser();
CompassTracking.trackScreen('home');
```

`resetUser` turns the device into a new visitor: the site user id is dropped, a new
internal user id, first visit and session are minted, user vars and segments are emptied
and the whole local CDP state (master id, cached rfv/cohorts, mirrors, meters, anonymous
consent memory) is wiped. The local rotation happens before the promise is created; the
promise settles once a best-effort remote CDP reset finishes (bounded to five seconds).
It never rejects and never re-resolves identity — the next `trackNewPage` / `trackScreen`
does, so call one after signing out. Concurrent calls share one run.

### Multimedia Tracking

```typescript
import { MultimediaTracking, MultimediaType, MultimediaEvent } from '@marfeel/react-native-sdk';

MultimediaTracking.initializeItem('video-1', 'youtube', 'abc123', MultimediaType.Video, {
  title: 'My Video',
  duration: 300,
});

MultimediaTracking.registerEvent('video-1', MultimediaEvent.Play, 0);
MultimediaTracking.registerEvent('video-1', MultimediaEvent.Pause, 45);
```

### Consent

```typescript
CompassTracking.setConsent(true);  // User gave consent
CompassTracking.setConsent(false); // User revoked consent
```

### CDP

The Customer Data Platform (CDP) assigns a stable visitor `masterId`, carries
read-only RFV + cohorts, lets you push segments, and exposes server-authoritative
meters (e.g. metered paywalls).

The CDP is **opt-in** and gated behind two conditions: `enableCdp: true` at
initialization **and** personalization consent (`CompassTracking.setConsent(true)`).
Until both are satisfied, every call is inert and no network request is made.
Identity resolution is automatic — there is no method to call for it.

```typescript
import { Cdp, CdpIdentityTypes } from '@marfeel/react-native-sdk';

// Link a known identifier (login, CRM id, email hash…)
await Cdp.setIdentity(CdpIdentityTypes.REGISTERED_USER_ID, 'user-123', true);
await Cdp.setIdentity(CdpIdentityTypes.EMAIL_SHA256, await Cdp.hashEmail('user@example.com'));
await Cdp.deleteIdentity(CdpIdentityTypes.CRM_ID); // every crm_id the master owns

// Read the current identity contribution
const { masterId, rfv, cohorts, identityFresh } = await Cdp.getUserProfile();
const id = await Cdp.getMasterId();

// Segments and properties the CDP asserts server-side (never re-asserted by this device)
const serverSegments = await Cdp.listServerSegments();
const serverProperties = await Cdp.listServerProperties();

// Segments (publisher-assigned labels; written locally first, synced when allowed)
Cdp.addSegment('sports_fan');
Cdp.setSegments(['sports_fan', 'newsletter_subscriber']);
Cdp.removeSegment('sports_fan');
Cdp.clearSegments();
const segments = await Cdp.getSegments();

// Meters (stale-while-revalidate, fail-open)
const meters = await Cdp.getMeterSnapshot(); // network refresh
const cached = await Cdp.listMeters();       // in-memory mirror
const paywall = await Cdp.getMeter('paywall');

try {
  const updated = await Cdp.incrementMeter('paywall');
} catch (e) {
  // rejects with code METER_NOT_FOUND when the meter is not configured for the site
}
```

A `MeterState` is `{ name, count, threshold?, reached?, remaining?, startedAt?,
expiresAt?, window }`. The `threshold` / `reached` / `remaining` fields are present
only when the meter has a threshold configured; `startedAt` / `expiresAt` are ISO-8601
strings.

`setIdentity` rejects with a `TypeError` on an empty type or value instead of posting
them. `CdpIdentityTypes` lists the well-known types: the stable ones (`email`,
`email_sha256`, `phone`, `phone_sha256`, `external_id`, `customer_id`,
`registered_user_id`) make the user registered; the device-bound ones (`login_id`,
`crm_id`, `cookie`, `device_id`, `maid`, `idfa`, `idfv`, `rampid`, `push_token`) leave
them anonymous. `hashEmail` / `hashPhone` normalise (`trim` + lower-case for emails,
`trim` only for phones) and SHA-256 the value on the device. `linkIdentity` and
`getData` remain as deprecated aliases.

#### Publisher consents

Publisher consents (a privacy policy, a newsletter opt-in) are recorded in the CDP. They
are gated only on `enableCdp`, **not** on `setConsent`: a visitor who declines tracking and
accepts the privacy policy has still accepted it.

```typescript
const definition = await Cdp.getConsent({ consentId: 'privacy-policy' });
// { consentId, name, purpose, mandatory, acceptMethod, showPolicy, version }

const accepted = await Cdp.hasConsent({ consentId: 'privacy-policy', versionId: definition?.version?.versionId });
if (definition?.showPolicy === 'if-not-accepted' && accepted) {
  // nothing to show
}

const result = await Cdp.trackConsent({
  consentId: 'privacy-policy',
  versionId: definition?.version?.versionId ?? '1',
  status: 'accepted',
  metadata: { source: 'onboarding' },
  email: 'user@example.com', // optional; hashed on the device
});
```

`acceptMethod` is one of `check-box`, `pre-checked` or `form-submit` (show no box at
all). `showPolicy` is `always` or `if-not-accepted`; pair the latter with `hasConsent`.
A decision recorded before the device has a master id is remembered locally and replayed
once one exists; `hasConsent` answers from that memory in the meantime. `trackConsent`
and `getConsent` resolve `null` on failure; `hasConsent` resolves `false`.

## License

MIT
