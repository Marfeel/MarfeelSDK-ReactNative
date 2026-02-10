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

## License

MIT
