# React Native Bridge Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Create a React Native bridge SDK that exposes the native Compass SDKs (Android/iOS) to React Native apps.

**Architecture:** Old Architecture (Native Modules) with TypeScript wrapper. Native modules bridge to existing Compass SDKs. JavaScript API mirrors native SDK methods exactly.

**Tech Stack:** TypeScript, React Native Native Modules, Kotlin (Android), Swift (iOS), Jest for testing.

---

## Task 1: Project Setup - package.json

**Files:**
- Create: `package.json`

**Step 1: Create package.json**

```json
{
  "name": "@marfeel/react-native-sdk",
  "version": "0.1.0",
  "description": "React Native bridge for Marfeel Compass SDK",
  "main": "lib/commonjs/index.js",
  "module": "lib/module/index.js",
  "types": "lib/typescript/index.d.ts",
  "react-native": "src/index.ts",
  "source": "src/index.ts",
  "files": [
    "src",
    "lib",
    "android",
    "ios",
    "marfeel-react-native-sdk.podspec",
    "!**/__tests__",
    "!**/__fixtures__",
    "!**/__mocks__"
  ],
  "scripts": {
    "typescript": "tsc --noEmit",
    "lint": "eslint \"src/**/*.{ts,tsx}\"",
    "prepare": "bob build",
    "test": "jest"
  },
  "keywords": [
    "react-native",
    "marfeel",
    "compass",
    "analytics",
    "tracking"
  ],
  "repository": {
    "type": "git",
    "url": "git+https://github.com/Marfeel/MarfeelSDK-ReactNative.git"
  },
  "author": "Marfeel",
  "license": "MIT",
  "bugs": {
    "url": "https://github.com/Marfeel/MarfeelSDK-ReactNative/issues"
  },
  "homepage": "https://github.com/Marfeel/MarfeelSDK-ReactNative#readme",
  "publishConfig": {
    "registry": "https://registry.npmjs.org/",
    "access": "public"
  },
  "devDependencies": {
    "@types/jest": "^29.5.12",
    "@types/react": "^18.2.0",
    "@types/react-native": "^0.72.0",
    "eslint": "^8.57.0",
    "jest": "^29.7.0",
    "react": "18.2.0",
    "react-native": "0.73.0",
    "react-native-builder-bob": "^0.23.0",
    "typescript": "^5.3.0"
  },
  "peerDependencies": {
    "react": ">=17.0.0",
    "react-native": ">=0.60.0"
  },
  "react-native-builder-bob": {
    "source": "src",
    "output": "lib",
    "targets": [
      "commonjs",
      "module",
      ["typescript", { "project": "tsconfig.build.json" }]
    ]
  }
}
```

**Step 2: Run npm install**

Run: `npm install`
Expected: Dependencies installed, node_modules created

**Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: initialize package.json with dependencies"
```

---

## Task 2: TypeScript Configuration

**Files:**
- Create: `tsconfig.json`
- Create: `tsconfig.build.json`

**Step 1: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "rootDir": ".",
    "paths": {
      "@marfeel/react-native-sdk": ["./src/index"]
    },
    "allowUnreachableCode": false,
    "allowUnusedLabels": false,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "jsx": "react",
    "lib": ["ES2020"],
    "module": "ESNext",
    "moduleResolution": "node",
    "noFallthroughCasesInSwitch": true,
    "noImplicitReturns": true,
    "noImplicitUseStrict": false,
    "noStrictGenericChecks": false,
    "noUncheckedIndexedAccess": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "resolveJsonModule": true,
    "skipLibCheck": true,
    "strict": true,
    "target": "ES2020",
    "verbatimModuleSyntax": false
  },
  "exclude": ["lib", "node_modules"]
}
```

**Step 2: Create tsconfig.build.json**

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "rootDir": "src",
    "declaration": true,
    "declarationMap": true,
    "outDir": "lib/typescript"
  },
  "include": ["src"],
  "exclude": ["**/__tests__", "**/__mocks__"]
}
```

**Step 3: Verify TypeScript config**

Run: `npx tsc --noEmit`
Expected: No errors (no source files yet)

**Step 4: Commit**

```bash
git add tsconfig.json tsconfig.build.json
git commit -m "chore: add TypeScript configuration"
```

---

## Task 3: TypeScript Types

**Files:**
- Create: `src/types.ts`

**Step 1: Create types.ts with all type definitions**

```typescript
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
  scrollViewTag?: number;
  rs?: string;
}
```

**Step 2: Verify types compile**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add src/types.ts
git commit -m "feat: add TypeScript type definitions"
```

---

## Task 4: Native Module Spec (JavaScript interface)

**Files:**
- Create: `src/NativeMarfeelSdk.ts`

**Step 1: Create native module interface**

```typescript
import { NativeModules, Platform } from 'react-native';

const LINKING_ERROR =
  `The package '@marfeel/react-native-sdk' doesn't seem to be linked. Make sure: \n\n` +
  Platform.select({ ios: "- You have run 'pod install'\n", default: '' }) +
  '- You rebuilt the app after installing the package\n' +
  '- You are not using Expo Go\n';

export interface NativeMarfeelSdkType {
  initialize(accountId: string, pageTechnology: number | null): void;
  trackNewPage(url: string, scrollViewTag: number | null, rs: string | null): void;
  trackScreen(screen: string, scrollViewTag: number | null, rs: string | null): void;
  stopTracking(): void;
  setLandingPage(landingPage: string): void;
  setSiteUserId(userId: string): void;
  getUserId(): Promise<string>;
  setUserType(userType: number): void;
  getRFV(): Promise<string | null>;
  setPageVar(name: string, value: string): void;
  setPageMetric(name: string, value: number): void;
  setSessionVar(name: string, value: string): void;
  setUserVar(name: string, value: string): void;
  addUserSegment(segment: string): void;
  setUserSegments(segments: string[]): void;
  removeUserSegment(segment: string): void;
  clearUserSegments(): void;
  trackConversion(
    conversion: string,
    initiator: string | null,
    id: string | null,
    value: string | null,
    meta: Record<string, string> | null,
    scope: string | null
  ): void;
  setConsent(hasConsent: boolean): void;
  initializeMultimediaItem(
    id: string,
    provider: string,
    providerId: string,
    type: string,
    metadata: string
  ): void;
  registerMultimediaEvent(id: string, event: string, eventTime: number): void;
}

export const NativeMarfeelSdk: NativeMarfeelSdkType = NativeModules.MarfeelSdk
  ? NativeModules.MarfeelSdk
  : new Proxy(
      {},
      {
        get() {
          throw new Error(LINKING_ERROR);
        },
      }
    );
```

**Step 2: Verify compilation**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add src/NativeMarfeelSdk.ts
git commit -m "feat: add native module interface definition"
```

---

## Task 5: CompassTracking API

**Files:**
- Create: `src/CompassTracking.ts`

**Step 1: Create CompassTracking module**

```typescript
import type { RefObject } from 'react';
import type { ScrollView } from 'react-native';
import { findNodeHandle } from 'react-native';
import { NativeMarfeelSdk } from './NativeMarfeelSdk';
import type {
  ConversionOptions,
  RFV,
  TrackingOptions,
  UserTypeValue,
} from './types';
import { UserType } from './types';

function getScrollViewTag(ref?: RefObject<ScrollView>): number | null {
  if (!ref?.current) return null;
  return findNodeHandle(ref.current);
}

function getUserTypeNumericValue(userType: UserTypeValue): number {
  if (typeof userType === 'object' && 'custom' in userType) {
    return userType.custom;
  }
  return userType;
}

export const CompassTracking = {
  initialize(accountId: string, pageTechnology?: number): void {
    NativeMarfeelSdk.initialize(accountId, pageTechnology ?? null);
  },

  trackNewPage(
    url: string,
    options?: TrackingOptions & { scrollViewRef?: RefObject<ScrollView> }
  ): void {
    const scrollViewTag = options?.scrollViewRef
      ? getScrollViewTag(options.scrollViewRef)
      : options?.scrollViewTag ?? null;
    NativeMarfeelSdk.trackNewPage(url, scrollViewTag, options?.rs ?? null);
  },

  trackScreen(
    screen: string,
    options?: TrackingOptions & { scrollViewRef?: RefObject<ScrollView> }
  ): void {
    const scrollViewTag = options?.scrollViewRef
      ? getScrollViewTag(options.scrollViewRef)
      : options?.scrollViewTag ?? null;
    NativeMarfeelSdk.trackScreen(screen, scrollViewTag, options?.rs ?? null);
  },

  stopTracking(): void {
    NativeMarfeelSdk.stopTracking();
  },

  setLandingPage(landingPage: string): void {
    NativeMarfeelSdk.setLandingPage(landingPage);
  },

  setSiteUserId(userId: string): void {
    NativeMarfeelSdk.setSiteUserId(userId);
  },

  getUserId(): Promise<string> {
    return NativeMarfeelSdk.getUserId();
  },

  setUserType(userType: UserTypeValue): void {
    NativeMarfeelSdk.setUserType(getUserTypeNumericValue(userType));
  },

  async getRFV(): Promise<RFV | null> {
    const result = await NativeMarfeelSdk.getRFV();
    if (!result) return null;
    return JSON.parse(result) as RFV;
  },

  setPageVar(name: string, value: string): void {
    NativeMarfeelSdk.setPageVar(name, value);
  },

  setPageMetric(name: string, value: number): void {
    NativeMarfeelSdk.setPageMetric(name, value);
  },

  setSessionVar(name: string, value: string): void {
    NativeMarfeelSdk.setSessionVar(name, value);
  },

  setUserVar(name: string, value: string): void {
    NativeMarfeelSdk.setUserVar(name, value);
  },

  addUserSegment(segment: string): void {
    NativeMarfeelSdk.addUserSegment(segment);
  },

  setUserSegments(segments: string[]): void {
    NativeMarfeelSdk.setUserSegments(segments);
  },

  removeUserSegment(segment: string): void {
    NativeMarfeelSdk.removeUserSegment(segment);
  },

  clearUserSegments(): void {
    NativeMarfeelSdk.clearUserSegments();
  },

  trackConversion(conversion: string, options?: ConversionOptions): void {
    NativeMarfeelSdk.trackConversion(
      conversion,
      options?.initiator ?? null,
      options?.id ?? null,
      options?.value ?? null,
      options?.meta ?? null,
      options?.scope ?? null
    );
  },

  setConsent(hasConsent: boolean): void {
    NativeMarfeelSdk.setConsent(hasConsent);
  },
};
```

**Step 2: Verify compilation**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add src/CompassTracking.ts
git commit -m "feat: add CompassTracking JavaScript API"
```

---

## Task 6: MultimediaTracking API

**Files:**
- Create: `src/MultimediaTracking.ts`

**Step 1: Create MultimediaTracking module**

```typescript
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
```

**Step 2: Verify compilation**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add src/MultimediaTracking.ts
git commit -m "feat: add MultimediaTracking JavaScript API"
```

---

## Task 7: CompassScrollView Component

**Files:**
- Create: `src/components/CompassScrollView.tsx`

**Step 1: Create CompassScrollView component**

```typescript
import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
} from 'react';
import {
  FlatList,
  findNodeHandle,
  ScrollView,
  SectionList,
} from 'react-native';
import type {
  FlatListProps,
  ScrollViewProps,
  SectionListProps,
} from 'react-native';

type ScrollableComponent =
  | typeof ScrollView
  | typeof FlatList
  | typeof SectionList;

let activeScrollViewTag: number | null = null;

export function getActiveScrollViewTag(): number | null {
  return activeScrollViewTag;
}

export function clearActiveScrollViewTag(): void {
  activeScrollViewTag = null;
}

type CompassScrollViewProps<T extends ScrollableComponent = typeof ScrollView> =
  T extends typeof FlatList
    ? FlatListProps<unknown> & { as: typeof FlatList }
    : T extends typeof SectionList
      ? SectionListProps<unknown> & { as: typeof SectionList }
      : ScrollViewProps & { as?: typeof ScrollView };

function CompassScrollViewInner<T extends ScrollableComponent = typeof ScrollView>(
  props: CompassScrollViewProps<T>,
  ref: React.Ref<ScrollView | FlatList | SectionList>
) {
  const { as: Component = ScrollView, ...rest } = props;
  const innerRef = useRef<ScrollView | FlatList | SectionList>(null);

  useImperativeHandle(ref, () => innerRef.current as ScrollView);

  useEffect(() => {
    if (innerRef.current) {
      activeScrollViewTag = findNodeHandle(innerRef.current);
    }
    return () => {
      activeScrollViewTag = null;
    };
  }, []);

  return <Component ref={innerRef} {...(rest as ScrollViewProps)} />;
}

export const CompassScrollView = forwardRef(CompassScrollViewInner) as <
  T extends ScrollableComponent = typeof ScrollView,
>(
  props: CompassScrollViewProps<T> & { ref?: React.Ref<ScrollView> }
) => React.ReactElement;
```

**Step 2: Verify compilation**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add src/components/CompassScrollView.tsx
git commit -m "feat: add CompassScrollView wrapper component"
```

---

## Task 8: Main Index Export

**Files:**
- Create: `src/index.ts`

**Step 1: Create main index.ts**

```typescript
export { CompassTracking } from './CompassTracking';
export { MultimediaTracking } from './MultimediaTracking';
export {
  CompassScrollView,
  getActiveScrollViewTag,
  clearActiveScrollViewTag,
} from './components/CompassScrollView';
export {
  UserType,
  ConversionScope,
  MultimediaType,
  MultimediaEvent,
} from './types';
export type {
  CustomUserType,
  UserTypeValue,
  ConversionOptions,
  MultimediaMetadata,
  RFV,
  TrackingOptions,
} from './types';
```

**Step 2: Verify compilation**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add src/index.ts
git commit -m "feat: add main index exports"
```

---

## Task 9: Android Native Module - Build Configuration

**Files:**
- Create: `android/build.gradle`
- Create: `android/src/main/AndroidManifest.xml`

**Step 1: Create android/build.gradle**

```gradle
buildscript {
    repositories {
        google()
        mavenCentral()
    }
    dependencies {
        classpath "org.jetbrains.kotlin:kotlin-gradle-plugin:1.9.22"
    }
}

apply plugin: "com.android.library"
apply plugin: "kotlin-android"

def safeExtGet(prop, fallback) {
    rootProject.ext.has(prop) ? rootProject.ext.get(prop) : fallback
}

android {
    namespace "com.marfeel.reactnative"
    compileSdkVersion safeExtGet("compileSdkVersion", 34)

    defaultConfig {
        minSdkVersion safeExtGet("minSdkVersion", 23)
        targetSdkVersion safeExtGet("targetSdkVersion", 34)
    }

    sourceSets {
        main {
            java.srcDirs = ["src/main/java"]
        }
    }

    compileOptions {
        sourceCompatibility JavaVersion.VERSION_17
        targetCompatibility JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }
}

repositories {
    google()
    mavenCentral()
    maven {
        url "https://repositories.mrf.io/nexus/repository/mvn-marfeel-public/"
    }
}

dependencies {
    implementation "com.facebook.react:react-android:+"
    implementation "org.jetbrains.kotlin:kotlin-stdlib:1.9.22"
    implementation "com.marfeel.compass:core:1.16.4"
}
```

**Step 2: Create android/src/main/AndroidManifest.xml**

```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.marfeel.reactnative">
</manifest>
```

**Step 3: Commit**

```bash
git add android/build.gradle android/src/main/AndroidManifest.xml
git commit -m "chore: add Android build configuration"
```

---

## Task 10: Android Native Module - Package

**Files:**
- Create: `android/src/main/java/com/marfeel/reactnative/MarfeelSdkPackage.kt`

**Step 1: Create MarfeelSdkPackage.kt**

```kotlin
package com.marfeel.reactnative

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager

class MarfeelSdkPackage : ReactPackage {
    override fun createNativeModules(reactContext: ReactApplicationContext): List<NativeModule> {
        return listOf(MarfeelSdkModule(reactContext))
    }

    override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<*, *>> {
        return emptyList()
    }
}
```

**Step 2: Commit**

```bash
git add android/src/main/java/com/marfeel/reactnative/MarfeelSdkPackage.kt
git commit -m "feat: add Android MarfeelSdkPackage"
```

---

## Task 11: Android Native Module - Module Implementation

**Files:**
- Create: `android/src/main/java/com/marfeel/reactnative/MarfeelSdkModule.kt`

**Step 1: Create MarfeelSdkModule.kt**

```kotlin
package com.marfeel.reactnative

import android.view.View
import android.widget.ScrollView
import androidx.recyclerview.widget.RecyclerView
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.uimanager.UIManagerModule
import com.marfeel.compass.tracker.CompassTracking
import com.marfeel.compass.tracker.ConversionOptions
import com.marfeel.compass.tracker.ConversionScope
import com.marfeel.compass.tracker.UserType
import com.marfeel.compass.tracker.multimedia.MultimediaTracking
import com.marfeel.compass.tracker.multimedia.Event
import com.marfeel.compass.tracker.multimedia.MultimediaMetadata
import com.marfeel.compass.tracker.multimedia.Type
import org.json.JSONObject

@ReactModule(name = MarfeelSdkModule.NAME)
class MarfeelSdkModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    companion object {
        const val NAME = "MarfeelSdk"
    }

    override fun getName(): String = NAME

    private fun findScrollView(tag: Int): ScrollView? {
        return try {
            val uiManager = reactContext.getNativeModule(UIManagerModule::class.java)
            val view = uiManager?.resolveView(tag)
            findScrollViewInHierarchy(view)
        } catch (e: Exception) {
            null
        }
    }

    private fun findScrollViewInHierarchy(view: View?): ScrollView? {
        if (view == null) return null
        if (view is ScrollView) return view
        if (view is android.view.ViewGroup) {
            for (i in 0 until view.childCount) {
                val found = findScrollViewInHierarchy(view.getChildAt(i))
                if (found != null) return found
            }
        }
        return null
    }

    @ReactMethod
    fun initialize(accountId: String, pageTechnology: Int?) {
        val context = reactContext.applicationContext
        if (pageTechnology != null) {
            CompassTracking.initialize(context, accountId, pageTechnology)
        } else {
            CompassTracking.initialize(context, accountId)
        }
    }

    @ReactMethod
    fun trackNewPage(url: String, scrollViewTag: Int?, rs: String?) {
        val scrollView = scrollViewTag?.let { findScrollView(it) }
        if (scrollView != null) {
            CompassTracking.getInstance().trackNewPage(url, scrollView, rs)
        } else {
            CompassTracking.getInstance().trackNewPage(url, rs)
        }
    }

    @ReactMethod
    fun trackScreen(screen: String, scrollViewTag: Int?, rs: String?) {
        val scrollView = scrollViewTag?.let { findScrollView(it) }
        if (scrollView != null) {
            CompassTracking.getInstance().trackScreen(screen, scrollView, rs)
        } else {
            CompassTracking.getInstance().trackScreen(screen, rs)
        }
    }

    @ReactMethod
    fun stopTracking() {
        CompassTracking.getInstance().stopTracking()
    }

    @ReactMethod
    fun setLandingPage(landingPage: String) {
        CompassTracking.getInstance().setLandingPage(landingPage)
    }

    @ReactMethod
    fun setSiteUserId(userId: String) {
        CompassTracking.getInstance().setSiteUserId(userId)
    }

    @ReactMethod
    fun getUserId(promise: Promise) {
        try {
            val userId = CompassTracking.getInstance().getUserId()
            promise.resolve(userId)
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }

    @ReactMethod
    fun setUserType(userType: Int) {
        val type = when (userType) {
            1 -> UserType.Anonymous
            2 -> UserType.Logged
            3 -> UserType.Paid
            else -> UserType.Custom(userType)
        }
        CompassTracking.getInstance().setUserType(type)
    }

    @ReactMethod
    fun getRFV(promise: Promise) {
        CompassTracking.getInstance().getRFV { rfv ->
            promise.resolve(rfv)
        }
    }

    @ReactMethod
    fun setPageVar(name: String, value: String) {
        CompassTracking.getInstance().setPageVar(name, value)
    }

    @ReactMethod
    fun setPageMetric(name: String, value: Int) {
        CompassTracking.getInstance().setPageMetric(name, value)
    }

    @ReactMethod
    fun setSessionVar(name: String, value: String) {
        CompassTracking.getInstance().setSessionVar(name, value)
    }

    @ReactMethod
    fun setUserVar(name: String, value: String) {
        CompassTracking.getInstance().setUserVar(name, value)
    }

    @ReactMethod
    fun addUserSegment(segment: String) {
        CompassTracking.getInstance().addUserSegment(segment)
    }

    @ReactMethod
    fun setUserSegments(segments: ReadableArray) {
        val list = mutableListOf<String>()
        for (i in 0 until segments.size()) {
            segments.getString(i)?.let { list.add(it) }
        }
        CompassTracking.getInstance().setUserSegments(list)
    }

    @ReactMethod
    fun removeUserSegment(segment: String) {
        CompassTracking.getInstance().removeUserSegment(segment)
    }

    @ReactMethod
    fun clearUserSegments() {
        CompassTracking.getInstance().clearUserSegments()
    }

    @ReactMethod
    fun trackConversion(
        conversion: String,
        initiator: String?,
        id: String?,
        value: String?,
        meta: ReadableMap?,
        scope: String?
    ) {
        val metaMap = meta?.let {
            val map = mutableMapOf<String, String>()
            val iterator = it.keySetIterator()
            while (iterator.hasNextKey()) {
                val key = iterator.nextKey()
                it.getString(key)?.let { v -> map[key] = v }
            }
            map
        }

        val conversionScope = when (scope) {
            "user" -> ConversionScope.User
            "session" -> ConversionScope.Session
            "page" -> ConversionScope.Page
            else -> null
        }

        if (initiator == null && id == null && value == null && metaMap == null && conversionScope == null) {
            CompassTracking.getInstance().trackConversion(conversion)
        } else {
            CompassTracking.getInstance().trackConversion(
                conversion,
                ConversionOptions(
                    initiator = initiator,
                    id = id,
                    value = value,
                    meta = metaMap,
                    scope = conversionScope
                )
            )
        }
    }

    @ReactMethod
    fun setConsent(hasConsent: Boolean) {
        CompassTracking.getInstance().setUserConsent(hasConsent)
    }

    @ReactMethod
    fun initializeMultimediaItem(
        id: String,
        provider: String,
        providerId: String,
        type: String,
        metadataJson: String
    ) {
        val mediaType = if (type == "audio") Type.AUDIO else Type.VIDEO
        val json = JSONObject(metadataJson)
        val metadata = MultimediaMetadata(
            isLive = if (json.has("isLive")) json.getBoolean("isLive") else false,
            title = if (json.has("title")) json.getString("title") else null,
            description = if (json.has("description")) json.getString("description") else null,
            url = if (json.has("url")) json.getString("url") else null,
            thumbnail = if (json.has("thumbnail")) json.getString("thumbnail") else null,
            authors = if (json.has("authors")) json.getString("authors") else null,
            publishTime = if (json.has("publishTime")) json.getLong("publishTime") else null,
            duration = if (json.has("duration")) json.getInt("duration") else null
        )
        MultimediaTracking.getInstance().initializeItem(id, provider, providerId, mediaType, metadata)
    }

    @ReactMethod
    fun registerMultimediaEvent(id: String, event: String, eventTime: Int) {
        val mediaEvent = when (event) {
            "play" -> Event.PLAY
            "pause" -> Event.PAUSE
            "end" -> Event.END
            "updateCurrentTime" -> Event.UPDATE_CURRENT_TIME
            "adPlay" -> Event.AD_PLAY
            "mute" -> Event.MUTE
            "unmute" -> Event.UNMUTE
            "fullscreen" -> Event.FULL_SCREEN
            "backscreen" -> Event.BACK_SCREEN
            "enterViewport" -> Event.ENTER_VIEWPORT
            "leaveViewport" -> Event.LEAVE_VIEWPORT
            else -> return
        }
        MultimediaTracking.getInstance().registerEvent(id, mediaEvent, eventTime)
    }
}
```

**Step 2: Commit**

```bash
git add android/src/main/java/com/marfeel/reactnative/MarfeelSdkModule.kt
git commit -m "feat: add Android MarfeelSdkModule implementation"
```

---

## Task 12: iOS Native Module - Podspec

**Files:**
- Create: `marfeel-react-native-sdk.podspec`

**Step 1: Create podspec**

```ruby
require "json"

package = JSON.parse(File.read(File.join(__dir__, "package.json")))

Pod::Spec.new do |s|
  s.name         = "marfeel-react-native-sdk"
  s.version      = package["version"]
  s.summary      = package["description"]
  s.homepage     = package["homepage"]
  s.license      = package["license"]
  s.authors      = package["author"]

  s.platforms    = { :ios => "13.0" }
  s.source       = { :git => package["repository"]["url"], :tag => "#{s.version}" }

  s.source_files = "ios/**/*.{h,m,mm,swift}"

  s.dependency "React-Core"
  s.dependency "MarfeelSDK-iOS", "~> 2.18"
end
```

**Step 2: Commit**

```bash
git add marfeel-react-native-sdk.podspec
git commit -m "chore: add iOS podspec"
```

---

## Task 13: iOS Native Module - Objective-C Bridge

**Files:**
- Create: `ios/MarfeelSdk.m`

**Step 1: Create Objective-C bridge**

```objc
#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(MarfeelSdk, NSObject)

RCT_EXTERN_METHOD(initialize:(NSString *)accountId pageTechnology:(nonnull NSNumber *)pageTechnology)
RCT_EXTERN_METHOD(trackNewPage:(NSString *)url scrollViewTag:(nonnull NSNumber *)scrollViewTag rs:(NSString *)rs)
RCT_EXTERN_METHOD(trackScreen:(NSString *)screen scrollViewTag:(nonnull NSNumber *)scrollViewTag rs:(NSString *)rs)
RCT_EXTERN_METHOD(stopTracking)
RCT_EXTERN_METHOD(setLandingPage:(NSString *)landingPage)
RCT_EXTERN_METHOD(setSiteUserId:(NSString *)userId)
RCT_EXTERN_METHOD(getUserId:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(setUserType:(int)userType)
RCT_EXTERN_METHOD(getRFV:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(setPageVar:(NSString *)name value:(NSString *)value)
RCT_EXTERN_METHOD(setPageMetric:(NSString *)name value:(int)value)
RCT_EXTERN_METHOD(setSessionVar:(NSString *)name value:(NSString *)value)
RCT_EXTERN_METHOD(setUserVar:(NSString *)name value:(NSString *)value)
RCT_EXTERN_METHOD(addUserSegment:(NSString *)segment)
RCT_EXTERN_METHOD(setUserSegments:(NSArray *)segments)
RCT_EXTERN_METHOD(removeUserSegment:(NSString *)segment)
RCT_EXTERN_METHOD(clearUserSegments)
RCT_EXTERN_METHOD(trackConversion:(NSString *)conversion initiator:(NSString *)initiator id:(NSString *)id value:(NSString *)value meta:(NSDictionary *)meta scope:(NSString *)scope)
RCT_EXTERN_METHOD(setConsent:(BOOL)hasConsent)
RCT_EXTERN_METHOD(initializeMultimediaItem:(NSString *)id provider:(NSString *)provider providerId:(NSString *)providerId type:(NSString *)type metadata:(NSString *)metadata)
RCT_EXTERN_METHOD(registerMultimediaEvent:(NSString *)id event:(NSString *)event eventTime:(int)eventTime)

+ (BOOL)requiresMainQueueSetup
{
  return YES;
}

@end
```

**Step 2: Commit**

```bash
git add ios/MarfeelSdk.m
git commit -m "feat: add iOS Objective-C bridge"
```

---

## Task 14: iOS Native Module - Swift Implementation

**Files:**
- Create: `ios/MarfeelSdk.swift`

**Step 1: Create Swift module**

```swift
import Foundation
import CompassSDK
import React

@objc(MarfeelSdk)
class MarfeelSdk: NSObject {

    private func findScrollView(tag: NSNumber?) -> UIScrollView? {
        guard let tag = tag, tag.intValue > 0 else { return nil }
        guard let bridge = RCTBridge.current() else { return nil }
        guard let uiManager = bridge.module(forName: "UIManager") as? RCTUIManager else { return nil }
        guard let view = uiManager.view(forReactTag: tag) else { return nil }
        return findScrollViewInHierarchy(view: view)
    }

    private func findScrollViewInHierarchy(view: UIView) -> UIScrollView? {
        if let scrollView = view as? UIScrollView {
            return scrollView
        }
        for subview in view.subviews {
            if let found = findScrollViewInHierarchy(view: subview) {
                return found
            }
        }
        return nil
    }

    @objc func initialize(_ accountId: String, pageTechnology: NSNumber?) {
        let accountIdInt = Int(accountId) ?? 0
        if let tech = pageTechnology?.intValue, tech > 0 {
            CompassTracker.initialize(accountId: accountIdInt, pageTechnology: tech)
        } else {
            CompassTracker.initialize(accountId: accountIdInt)
        }
    }

    @objc func trackNewPage(_ url: String, scrollViewTag: NSNumber?, rs: String?) {
        guard let pageUrl = URL(string: url) else { return }
        let scrollView = findScrollView(tag: scrollViewTag)
        CompassTracker.shared.trackNewPage(url: pageUrl, scrollView: scrollView, rs: rs)
    }

    @objc func trackScreen(_ screen: String, scrollViewTag: NSNumber?, rs: String?) {
        let scrollView = findScrollView(tag: scrollViewTag)
        CompassTracker.shared.trackScreen(name: screen, scrollView: scrollView, rs: rs)
    }

    @objc func stopTracking() {
        CompassTracker.shared.stopTracking()
    }

    @objc func setLandingPage(_ landingPage: String) {
        CompassTracker.shared.setLandingPage(landingPage)
    }

    @objc func setSiteUserId(_ userId: String) {
        CompassTracker.shared.setSiteUserId(userId)
    }

    @objc func getUserId(_ resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
        let userId = CompassTracker.shared.getUserId()
        resolve(userId)
    }

    @objc func setUserType(_ userType: Int) {
        let type: UserType
        switch userType {
        case 1: type = .anonymous
        case 2: type = .logged
        case 3: type = .paid
        default: type = .custom(userType)
        }
        CompassTracker.shared.setUserType(type)
    }

    @objc func getRFV(_ resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
        CompassTracker.shared.getRFV { rfv in
            if let rfv = rfv {
                let json: [String: Any] = [
                    "rfv": rfv.rfv,
                    "r": rfv.r,
                    "f": rfv.f,
                    "v": rfv.v
                ]
                if let data = try? JSONSerialization.data(withJSONObject: json),
                   let jsonString = String(data: data, encoding: .utf8) {
                    resolve(jsonString)
                } else {
                    resolve(nil)
                }
            } else {
                resolve(nil)
            }
        }
    }

    @objc func setPageVar(_ name: String, value: String) {
        CompassTracker.shared.setPageVar(name: name, value: value)
    }

    @objc func setPageMetric(_ name: String, value: Int) {
        CompassTracker.shared.setPageMetric(name: name, value: value)
    }

    @objc func setSessionVar(_ name: String, value: String) {
        CompassTracker.shared.setSessionVar(name: name, value: value)
    }

    @objc func setUserVar(_ name: String, value: String) {
        CompassTracker.shared.setUserVar(name: name, value: value)
    }

    @objc func addUserSegment(_ segment: String) {
        CompassTracker.shared.addUserSegment(segment)
    }

    @objc func setUserSegments(_ segments: [String]) {
        CompassTracker.shared.setUserSegments(segments)
    }

    @objc func removeUserSegment(_ segment: String) {
        CompassTracker.shared.removeUserSegment(segment)
    }

    @objc func clearUserSegments() {
        CompassTracker.shared.clearUserSegments()
    }

    @objc func trackConversion(_ conversion: String, initiator: String?, id: String?, value: String?, meta: [String: String]?, scope: String?) {
        let conversionScope: ConversionScope?
        switch scope {
        case "user": conversionScope = .user
        case "session": conversionScope = .session
        case "page": conversionScope = .page
        default: conversionScope = nil
        }

        if initiator == nil && id == nil && value == nil && meta == nil && conversionScope == nil {
            CompassTracker.shared.trackConversion(conversion: conversion)
        } else {
            let options = ConversionOptions(
                initiator: initiator,
                id: id,
                value: value,
                meta: meta,
                scope: conversionScope
            )
            CompassTracker.shared.trackConversion(conversion: conversion, options: options)
        }
    }

    @objc func setConsent(_ hasConsent: Bool) {
        CompassTracker.shared.setConsent(hasConsent)
    }

    @objc func initializeMultimediaItem(_ id: String, provider: String, providerId: String, type: String, metadata: String) {
        let mediaType: CompassSDK.`Type` = type == "audio" ? .AUDIO : .VIDEO

        var multimediaMetadata = MultimediaMetadata()
        if let data = metadata.data(using: .utf8),
           let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any] {
            multimediaMetadata = MultimediaMetadata(
                isLive: json["isLive"] as? Bool ?? false,
                title: json["title"] as? String,
                description: json["description"] as? String,
                url: (json["url"] as? String).flatMap { URL(string: $0) },
                thumbnail: (json["thumbnail"] as? String).flatMap { URL(string: $0) },
                authors: json["authors"] as? String,
                publishTime: (json["publishTime"] as? Int64).flatMap { Date(timeIntervalSince1970: TimeInterval($0) / 1000) },
                duration: json["duration"] as? Int
            )
        }

        CompassTrackerMultimedia.shared.initializeItem(
            id: id,
            provider: provider,
            providerId: providerId,
            type: mediaType,
            metadata: multimediaMetadata
        )
    }

    @objc func registerMultimediaEvent(_ id: String, event: String, eventTime: Int) {
        let mediaEvent: Event
        switch event {
        case "play": mediaEvent = .PLAY
        case "pause": mediaEvent = .PAUSE
        case "end": mediaEvent = .END
        case "updateCurrentTime": mediaEvent = .UPDATE_CURRENT_TIME
        case "adPlay": mediaEvent = .AD_PLAY
        case "mute": mediaEvent = .MUTE
        case "unmute": mediaEvent = .UNMUTE
        case "fullscreen": mediaEvent = .FULL_SCREEN
        case "backscreen": mediaEvent = .BACK_SCREEN
        case "enterViewport": mediaEvent = .ENTER_VIEWPORT
        case "leaveViewport": mediaEvent = .LEAVE_VIEWPORT
        default: return
        }

        CompassTrackerMultimedia.shared.registerEvent(id: id, event: mediaEvent, eventTime: eventTime)
    }
}
```

**Step 2: Commit**

```bash
git add ios/MarfeelSdk.swift
git commit -m "feat: add iOS Swift module implementation"
```

---

## Task 15: Jest Configuration & Tests

**Files:**
- Create: `jest.config.js`
- Create: `src/__tests__/CompassTracking.test.ts`

**Step 1: Create jest.config.js**

```javascript
module.exports = {
  preset: 'react-native',
  modulePathIgnorePatterns: ['<rootDir>/lib/'],
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native)/)',
  ],
  setupFiles: ['<rootDir>/src/__tests__/setup.ts'],
};
```

**Step 2: Create test setup**

Create: `src/__tests__/setup.ts`

```typescript
jest.mock('react-native', () => ({
  NativeModules: {
    MarfeelSdk: {
      initialize: jest.fn(),
      trackNewPage: jest.fn(),
      trackScreen: jest.fn(),
      stopTracking: jest.fn(),
      setLandingPage: jest.fn(),
      setSiteUserId: jest.fn(),
      getUserId: jest.fn().mockResolvedValue('test-user-id'),
      setUserType: jest.fn(),
      getRFV: jest.fn().mockResolvedValue('{"rfv":0.5,"r":1,"f":2,"v":3}'),
      setPageVar: jest.fn(),
      setPageMetric: jest.fn(),
      setSessionVar: jest.fn(),
      setUserVar: jest.fn(),
      addUserSegment: jest.fn(),
      setUserSegments: jest.fn(),
      removeUserSegment: jest.fn(),
      clearUserSegments: jest.fn(),
      trackConversion: jest.fn(),
      setConsent: jest.fn(),
      initializeMultimediaItem: jest.fn(),
      registerMultimediaEvent: jest.fn(),
    },
  },
  Platform: {
    select: jest.fn((obj) => obj.default || obj.ios),
  },
  findNodeHandle: jest.fn(() => 123),
  ScrollView: 'ScrollView',
  FlatList: 'FlatList',
  SectionList: 'SectionList',
}));
```

**Step 3: Create CompassTracking tests**

Create: `src/__tests__/CompassTracking.test.ts`

```typescript
import { NativeModules } from 'react-native';
import { CompassTracking } from '../CompassTracking';
import { UserType, ConversionScope } from '../types';

const mockNativeModule = NativeModules.MarfeelSdk;

describe('CompassTracking', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('initialize', () => {
    it('calls native initialize with accountId', () => {
      CompassTracking.initialize('12345');
      expect(mockNativeModule.initialize).toHaveBeenCalledWith('12345', null);
    });

    it('calls native initialize with pageTechnology', () => {
      CompassTracking.initialize('12345', 11);
      expect(mockNativeModule.initialize).toHaveBeenCalledWith('12345', 11);
    });
  });

  describe('trackNewPage', () => {
    it('calls native trackNewPage with url only', () => {
      CompassTracking.trackNewPage('https://example.com');
      expect(mockNativeModule.trackNewPage).toHaveBeenCalledWith(
        'https://example.com',
        null,
        null
      );
    });

    it('calls native trackNewPage with rs option', () => {
      CompassTracking.trackNewPage('https://example.com', { rs: 'homepage' });
      expect(mockNativeModule.trackNewPage).toHaveBeenCalledWith(
        'https://example.com',
        null,
        'homepage'
      );
    });
  });

  describe('setUserType', () => {
    it('handles UserType.Anonymous', () => {
      CompassTracking.setUserType(UserType.Anonymous);
      expect(mockNativeModule.setUserType).toHaveBeenCalledWith(1);
    });

    it('handles UserType.Logged', () => {
      CompassTracking.setUserType(UserType.Logged);
      expect(mockNativeModule.setUserType).toHaveBeenCalledWith(2);
    });

    it('handles custom user type', () => {
      CompassTracking.setUserType({ custom: 99 });
      expect(mockNativeModule.setUserType).toHaveBeenCalledWith(99);
    });
  });

  describe('getRFV', () => {
    it('parses RFV response', async () => {
      const rfv = await CompassTracking.getRFV();
      expect(rfv).toEqual({ rfv: 0.5, r: 1, f: 2, v: 3 });
    });
  });

  describe('trackConversion', () => {
    it('calls with conversion only', () => {
      CompassTracking.trackConversion('signup');
      expect(mockNativeModule.trackConversion).toHaveBeenCalledWith(
        'signup',
        null,
        null,
        null,
        null,
        null
      );
    });

    it('calls with full options', () => {
      CompassTracking.trackConversion('purchase', {
        initiator: 'button',
        id: 'order-123',
        value: '99.99',
        meta: { currency: 'USD' },
        scope: ConversionScope.User,
      });
      expect(mockNativeModule.trackConversion).toHaveBeenCalledWith(
        'purchase',
        'button',
        'order-123',
        '99.99',
        { currency: 'USD' },
        'user'
      );
    });
  });
});
```

**Step 4: Run tests**

Run: `npm test`
Expected: All tests pass

**Step 5: Commit**

```bash
git add jest.config.js src/__tests__/setup.ts src/__tests__/CompassTracking.test.ts
git commit -m "test: add Jest configuration and CompassTracking tests"
```

---

## Task 16: README Documentation

**Files:**
- Update: `README.md`

**Step 1: Update README.md**

```markdown
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

## API Reference

See the [design document](docs/plans/2026-02-05-react-native-bridge-design.md) for full API details.

## License

MIT
```

**Step 2: Commit**

```bash
git add README.md
git commit -m "docs: add comprehensive README"
```

---

## Task 17: Final Build Verification

**Step 1: Run TypeScript compilation**

Run: `npm run typescript`
Expected: No errors

**Step 2: Run tests**

Run: `npm test`
Expected: All tests pass

**Step 3: Build the package**

Run: `npm run prepare`
Expected: lib/ directory created with commonjs, module, and typescript outputs

**Step 4: Final commit**

```bash
git add -A
git commit -m "chore: final build verification"
```

---

## Summary

17 tasks total covering:
- Project setup (package.json, tsconfig)
- TypeScript types and API layer
- Android native module (Kotlin)
- iOS native module (Swift/Obj-C)
- CompassScrollView component
- Jest tests
- Documentation

Each task is independently committable and follows TDD where applicable.
