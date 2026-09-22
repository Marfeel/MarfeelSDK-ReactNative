# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm test                  # Run all tests (Vitest)
npx vitest run src/__tests__/CompassTracking.test.ts  # Run a single test file
npm run typescript        # Type check (tsc --noEmit)
npm run lint              # ESLint on src/**/*.{ts,tsx}
npm run prepare           # Build with react-native-builder-bob (commonjs + module + types → lib/)
```

### Example app (from `example/` directory)

```bash
npm start                 # Start Metro bundler
npm run android           # Run on Android
npm run ios               # Run on iOS (run `cd ios && pod install` first)
```

## Architecture

React Native bridge (Old Architecture / Native Modules) for the Marfeel Compass analytics SDK.

### Layer structure

```
src/CompassTracking.ts, MultimediaTracking.ts   ← Public TypeScript API (stateless objects)
src/NativeMarfeelSdk.ts                         ← Bridge interface (NativeModules.MarfeelSdk)
android/ MarfeelSdkModule.kt                    ← Android native module (Kotlin)
ios/ MarfeelSdk.swift + MarfeelSdk.m            ← iOS native module (Swift + ObjC bridge)
```

`NativeMarfeelSdk.ts` uses a Proxy to throw a descriptive linking error if the native module isn't available, rather than failing with undefined method calls.

### Native SDKs

- **Android:** `com.marfeel.compass:views` (version pinned in `android/build.gradle`) from `https://repositories.mrf.io/nexus/repository/mvn-marfeel-public/`
  - Import model classes from `com.marfeel.compass.core.model.compass.*` and `com.marfeel.compass.core.model.multimedia.*`
  - All `@ReactMethod` calls must be dispatched to the main thread via `Handler(Looper.getMainLooper()).post {}` because the Compass SDK uses `LifecycleRegistry`
- **iOS:** `MarfeelSDK-iOS ~> 2.18` via CocoaPods

The CDP surface (`src/Cdp.ts`) mirrors the native `Cdp` / `CdpTracking` namespaces and is **add-only**: `src/__tests__/PublicSurface.test.ts` pins every name. Old flat names (`linkIdentity`, `getData`, `resetIdentity`) stay as deprecated delegates. Complex CDP payloads (consent decisions, definitions, user profile, meters) cross the bridge as JSON strings; simple collections cross as arrays/maps. `resetUser` never rejects (the TS wrapper swallows native failures) and the native SDKs never re-resolve identity inside it.

To compile the native bridges against an **unpublished** native SDK build: Android — `./gradlew :compass:publishViewsReleasePublicationToMavenLocal` in the Android repo, then temporarily replace the `com.marfeel.compass:views` dependency in `android/build.gradle` with `implementation files("<~/.m2 path to views-x.y.z.aar>")` plus its POM dependencies, and run `./gradlew :marfeel_react-native-sdk:compileDebugKotlin` from `example/android`; iOS — temporarily add `pod 'MarfeelSDK-iOS', :path => '<local repo>'` to `example/ios/Podfile`, `pod install`, and build the `MarfeelExample` scheme. Revert every temporary edit afterwards.

### Testing

Uses **Vitest** (not Jest). The `react-native` import is aliased to `src/__tests__/react-native-mock.ts` via `resolve.alias` in `vitest.config.ts` to avoid Flow parser errors. The mock provides `vi.fn()` stubs for all native module methods.

### Example app & monorepo resolution

The `example/` app imports the SDK from the parent directory using Metro config:
- `extraNodeModules` maps `@marfeel/react-native-sdk` to the SDK root
- `blockList` prevents the SDK root's `react` and `react-native` copies from conflicting with the example's copies
- `.worktrees` directory is also blocked if present

### React lifecycle constraint

Child `useEffect` fires before parent `useEffect`. SDK initialization (`initialize`, `setLandingPage`, `trackScreen`) must all happen in the same top-level `useEffect`, not spread across parent/child components.

## Code Style

- No code comments explaining what code does — write self-explanatory code
- Only comment for: complex algorithm "why", non-obvious business logic, TODO/FIXME
