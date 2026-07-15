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
```

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
import { Cdp } from '@marfeel/react-native-sdk';

// Link a known identifier (login, CRM id, email hash…)
Cdp.linkIdentity('registered_user_id', 'user@example.com', true);

// Read the current identity contribution
const { masterId, rfv, cohorts } = await Cdp.getData();
const id = await Cdp.getMasterId();

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

## License

MIT
