# Recirculation & Experiences — React Native Bridge Implementation Plan

## Context

Marfeel's Compass SDKs for iOS (`MarfeelSDK-iOS`, branch shipping in `~> 2.18+`) and Android (`MarfeelSDK-Android`, branch `experiences-api`) **already implement** the Experiences and Recirculation APIs end-to-end (response parsing, frequency caps, experiment assignment, content resolution, recirculation pings, whole-module sentinel, etc.). All of that lives natively.

This repo is a **thin bridge** built on the React Native Old Architecture (Native Modules pattern). The work here is purely the bridge: surface the native `Experiences` and `Recirculation` singletons through `NativeModules.MarfeelSdk` so JS callers can invoke them. **No business logic, no parsing, no persistence is implemented in JS or in the native bridge layer.** All data crossing the bridge is plain JSON-compatible types (strings, numbers, booleans, arrays, dicts, `Promise`).

**Reference:**
- iOS implementation: `/Users/miquelmasriera/Marfeel/MarfeelSDK-iOS/CompassSDK/Experiences/`
- Android implementation: `/Users/miquelmasriera/Marfeel/MarfeelSDK-Android/compass/src/main/java/com/marfeel/compass/experiences/` (branch `experiences-api`)
- iOS design doc this plan parallels: `./ios_impl_plan.md`

**RN min versions:** iOS 13.0 (per podspec), Android per existing module. Old Architecture (no TurboModules / Codegen).

---

## Native Public API — what the bridge has to surface

### Recirculation (4 methods, all fire-and-forget)
```
trackEligible(name: String, links: [RecirculationLink])
trackImpression(name: String, links: [RecirculationLink])   // also a single-link convenience overload
trackClick(name: String, link: RecirculationLink)
```

### Experiences (5 tracking + 8 QA + 1 fetch + 1 targeting)
```
addTargeting(key: String, value: String)
fetchExperiences(filterByType?, filterByFamily?, resolve?, url?) → [Experience]   // suspend (Android) / completion (iOS)
trackEligible(experience, links)
trackImpression(experience, links)   // also single-link overload
trackClick(experience, link)
trackClose(experience)

clearFrequencyCaps()
getFrequencyCapCounts(experienceId) → [String: Int/Long]
getFrequencyCapConfig() → [String: [String]]
clearReadEditorials()
getReadEditorials() → [String]
getExperimentAssignments() → [String: String]
setExperimentAssignment(groupId, variantId)
clearExperimentAssignments()
```

### Experience model (the key bridging challenge)
`Experience` is a class on iOS / data class on Android with:
- Primitives: `id`, `name`, `placement?`, `contentUrl?`, `strategy?`
- Enums (string-encoded): `type`, `family?`, `contentType`
- Collections of structs: `selectors[]`, `filters[]`
- Free-form: `features?: Map<String, Any>`, `rawJson: Map<String, Any>`
- Mutable: `resolvedContent?: String`
- Internal ref to `ContentResolver` (used by `experience.resolve()`)

The `ContentResolver` reference and the **identity** of the Experience (for `resolve()` and for the impression-via-Experience tracking calls that delegate into `FrequencyCapManager`) **cannot cross the JS/native bridge**.

---

## Core design decisions

| Decision | Rationale |
|----------|-----------|
| **Native-side cache of last fetched `Experience` objects, keyed by `id`** | The Experience class holds an internal `ContentResolver` reference and is the type expected by the SDK's tracking methods. JS gets back only a serialized snapshot. The bridge module keeps a `[id: Experience]` map populated by `fetchExperiences`, looked up by tracking and resolve calls. |
| **Cache replacement policy: union, not replacement** | `fetchExperiences` is called per-page; tracking can fire after navigation. Merge new results into the cache (overwriting same id). No explicit invalidation — bounded by server-driven id space. Cleared on `stopTracking()`. |
| **JS calls reference Experiences by `id` (string), not by object** | All tracking entry points on the JS side accept either `experience: SerializedExperience` (we extract `.id` at the boundary) or a plain `experienceId: string`. The serialized object is just sugar — the wire format is the id. |
| **Lazy content resolution exposed as `Experiences.resolveContent(experienceId)`** | `fetchExperiences({ resolve: true })` continues to work as a batch path. Lazy single-item resolve is a new RN-only convenience that maps to `Experience.resolve(_:)` via cache lookup. |
| **Single native module (`MarfeelSdk`) — extend, don't add a second** | Existing pattern is a flat namespace under `NativeModules.MarfeelSdk`. Methods are prefixed `experiences*` / `recirculation*`. The TS layer splits them into `Experiences` and `Recirculation` objects for ergonomics. |
| **Android `fetchExperiences` is `suspend`** | Wrap in `kotlinx.coroutines.runBlocking` on the existing `runOnMainThread`'s `mainHandler`? No — use `CoroutineScope(Dispatchers.IO).launch { … promise.resolve() }`. The existing module already uses callback patterns for `getRFV`. |
| **iOS main-thread requirement does NOT apply to Experiences/Recirculation** | The CompassSDK requirement to dispatch to main thread (`Handler(Looper.getMainLooper()).post {}` on Android) was for `LifecycleRegistry`. Experiences/Recirculation singletons are not lifecycle-tied — they can run on the bridge's default queue. **Verify this**: check if `Experiences.shared` and `Recirculation.shared` use any UI / lifecycle APIs. If yes, keep the main-thread dispatch. |
| **All "getter" methods are exposed as `Promise<T>`** | RN bridge methods cannot return synchronously across the JS/native boundary. Even though the native getters are sync, the JS side awaits a Promise. |
| **No JS-side Experience class — plain interface only** | Matches existing repo style (`MultimediaTracking`, `CompassTracking` are plain objects of functions). `Experience` is a TypeScript `interface`. |

---

## File layout (RN repo)

```
src/
├── CompassTracking.ts                ← unchanged
├── MultimediaTracking.ts             ← unchanged
├── Experiences.ts                    ← NEW: public Experiences API (object of fns)
├── Recirculation.ts                  ← NEW: public Recirculation API (object of fns)
├── NativeMarfeelSdk.ts               ← UPDATED: 17 new method signatures
├── types.ts                          ← UPDATED: Experience, RecirculationLink, enums
└── index.ts                          ← UPDATED: re-export new APIs

ios/
├── MarfeelSdk.swift                  ← UPDATED: +17 @objc methods, +experienceCache
└── MarfeelSdk.m                      ← UPDATED: +17 RCT_EXTERN_METHOD declarations

android/src/main/java/com/marfeel/reactnative/
└── MarfeelSdkModule.kt               ← UPDATED: +17 @ReactMethod, +experienceCache,
                                                 +CoroutineScope for fetchExperiences

src/__tests__/
├── react-native-mock.ts              ← UPDATED: stub the 17 new native methods
├── Experiences.test.ts               ← NEW
└── Recirculation.test.ts             ← NEW

example/src/screens/
└── ExperiencesScreen.tsx             ← NEW: demo screen (fetch / track / QA)
```

---

## Phase 1: TypeScript types

### 1.1 `types.ts` — additions

```ts
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
  operator: string;   // server-side strings: 'eq' | 'neq' | 'contains' | 'ncontains' | 'gt' | 'gte' | 'lt' | 'lte' | 'EQUALS' | 'NOT_EQUALS' | …
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
```

**Notes on enum values:** the raw string values are the **exact server-side keys** so `JSON.stringify(experience.type)` round-trips through the bridge without enum-conversion code on either side. `ExperienceFamily` uses Android-style keys (`"twitterexperience"`) since iOS now also exposes them via `ExperienceFamily.fromKey`'s mapping. The native side passes the family's underlying server key (Swift: `family.rawValue`-style; Kotlin: `family.key`). **Confirm parity at integration time.**

### 1.2 Why `Experience` is an interface, not a class
- No methods (no `resolve()` on the JS object). Resolution is exposed as `Experiences.resolveContent(experienceId)` to keep the type plain-data and bridge-friendly.
- Avoids identity issues (same id fetched twice → equivalent JSON snapshots, no class-instance mismatch).

---

## Phase 2: NativeMarfeelSdk interface

### `src/NativeMarfeelSdk.ts` — added method signatures

```ts
// Recirculation
recirculationTrackEligible(name: string, links: RecirculationLink[]): void;
recirculationTrackImpression(name: string, links: RecirculationLink[]): void;
recirculationTrackClick(name: string, link: RecirculationLink): void;

// Experiences
experiencesAddTargeting(key: string, value: string): void;
experiencesFetch(
  filterByType: string | null,
  filterByFamily: string | null,
  resolve: boolean,
  url: string | null
): Promise<string>;   // JSON-encoded Experience[] — see § serialization below
experiencesResolveContent(experienceId: string): Promise<string | null>;

experiencesTrackEligible(experienceId: string, links: RecirculationLink[]): void;
experiencesTrackImpression(experienceId: string, links: RecirculationLink[]): void;
experiencesTrackClick(experienceId: string, link: RecirculationLink): void;
experiencesTrackClose(experienceId: string): void;

experiencesClearFrequencyCaps(): void;
experiencesGetFrequencyCapCounts(experienceId: string): Promise<Record<string, number>>;
experiencesGetFrequencyCapConfig(): Promise<Record<string, string[]>>;
experiencesClearReadEditorials(): void;
experiencesGetReadEditorials(): Promise<string[]>;
experiencesGetExperimentAssignments(): Promise<Record<string, string>>;
experiencesSetExperimentAssignment(groupId: string, variantId: string): void;
experiencesClearExperimentAssignments(): void;
```

### Why `experiencesFetch` returns `Promise<string>` (a JSON-encoded array), not `Promise<Experience[]>`
- `Experience.rawJson` is `[String: Any]`. The RN bridge's standard JSON conversion can pass dicts of primitives, but `Any`-typed values in Swift / `Map<String, Any>` in Kotlin are unsafe to feed directly through `RCTConvert` — `Date`, custom classes, or `NSNumber`/`Long` mismatches will throw or lose precision.
- Mirrors the existing `getRFV` pattern (see `MarfeelSdk.swift:58-77`): native serializes to JSON string with `JSONSerialization` and the JS layer parses.
- Keeps the bridge contract trivially typed (`String` → `String`), avoids Codegen friction if/when this repo migrates to Fabric.
- The TS public layer (`Experiences.fetchExperiences`) parses the string and returns typed `Experience[]`.

---

## Phase 3: Public TS API

### 3.1 `src/Recirculation.ts`

```ts
import { NativeMarfeelSdk } from './NativeMarfeelSdk';
import type { RecirculationLink } from './types';

export const Recirculation = {
  trackEligible(name: string, links: RecirculationLink[]): void {
    NativeMarfeelSdk.recirculationTrackEligible(name, links);
  },

  trackImpression(name: string, linkOrLinks: RecirculationLink | RecirculationLink[]): void {
    const links = Array.isArray(linkOrLinks) ? linkOrLinks : [linkOrLinks];
    NativeMarfeelSdk.recirculationTrackImpression(name, links);
  },

  trackClick(name: string, link: RecirculationLink): void {
    NativeMarfeelSdk.recirculationTrackClick(name, link);
  },
};
```

**Single-link overload via union type** matches the iOS dual signature without two native methods.

### 3.2 `src/Experiences.ts`

```ts
import { NativeMarfeelSdk } from './NativeMarfeelSdk';
import type {
  Experience,
  ExperienceFamily,
  ExperienceType,
  FetchExperiencesOptions,
  RecirculationLink,
} from './types';

type ExperienceRef = Experience | string;
const idOf = (ref: ExperienceRef): string =>
  typeof ref === 'string' ? ref : ref.id;

export const Experiences = {
  addTargeting(key: string, value: string): void {
    NativeMarfeelSdk.experiencesAddTargeting(key, value);
  },

  async fetchExperiences(options?: FetchExperiencesOptions): Promise<Experience[]> {
    const json = await NativeMarfeelSdk.experiencesFetch(
      options?.filterByType ?? null,
      options?.filterByFamily ?? null,
      options?.resolve ?? false,
      options?.url ?? null
    );
    return JSON.parse(json) as Experience[];
  },

  async resolveContent(experience: ExperienceRef): Promise<string | null> {
    return NativeMarfeelSdk.experiencesResolveContent(idOf(experience));
  },

  trackEligible(experience: ExperienceRef, links: RecirculationLink[]): void {
    NativeMarfeelSdk.experiencesTrackEligible(idOf(experience), links);
  },

  trackImpression(experience: ExperienceRef, linkOrLinks: RecirculationLink | RecirculationLink[]): void {
    const links = Array.isArray(linkOrLinks) ? linkOrLinks : [linkOrLinks];
    NativeMarfeelSdk.experiencesTrackImpression(idOf(experience), links);
  },

  trackClick(experience: ExperienceRef, link: RecirculationLink): void {
    NativeMarfeelSdk.experiencesTrackClick(idOf(experience), link);
  },

  trackClose(experience: ExperienceRef): void {
    NativeMarfeelSdk.experiencesTrackClose(idOf(experience));
  },

  // QA / debug
  clearFrequencyCaps(): void { NativeMarfeelSdk.experiencesClearFrequencyCaps(); },
  getFrequencyCapCounts(experienceId: string): Promise<Record<string, number>> {
    return NativeMarfeelSdk.experiencesGetFrequencyCapCounts(experienceId);
  },
  getFrequencyCapConfig(): Promise<Record<string, string[]>> {
    return NativeMarfeelSdk.experiencesGetFrequencyCapConfig();
  },
  clearReadEditorials(): void { NativeMarfeelSdk.experiencesClearReadEditorials(); },
  getReadEditorials(): Promise<string[]> { return NativeMarfeelSdk.experiencesGetReadEditorials(); },
  getExperimentAssignments(): Promise<Record<string, string>> {
    return NativeMarfeelSdk.experiencesGetExperimentAssignments();
  },
  setExperimentAssignment(groupId: string, variantId: string): void {
    NativeMarfeelSdk.experiencesSetExperimentAssignment(groupId, variantId);
  },
  clearExperimentAssignments(): void { NativeMarfeelSdk.experiencesClearExperimentAssignments(); },
};
```

### 3.3 `src/index.ts` — re-exports

```ts
export { Experiences } from './Experiences';
export { Recirculation } from './Recirculation';
export {
  ExperienceType,
  ExperienceFamily,
  ExperienceContentType,
} from './types';
export type {
  Experience,
  ExperienceSelector,
  ExperienceFilter,
  RecirculationLink,
  FetchExperiencesOptions,
} from './types';
```

---

## Phase 4: iOS bridge

### 4.1 `ios/MarfeelSdk.swift` — add an `experienceCache`

```swift
private var experienceCache: [String: Experience] = [:]
private let cacheQueue = DispatchQueue(label: "com.marfeel.rn.expcache", attributes: .concurrent)

private func cache(_ experiences: [Experience]) {
    cacheQueue.async(flags: .barrier) {
        for e in experiences { self.experienceCache[e.id] = e }
    }
}
private func cached(_ id: String) -> Experience? {
    cacheQueue.sync { experienceCache[id] }
}
```

Cache is also wiped from `stopTracking`:
```swift
@objc func stopTracking() {
    CompassTracker.shared.stopTracking()
    cacheQueue.async(flags: .barrier) { self.experienceCache.removeAll() }
}
```

### 4.2 Recirculation methods

```swift
@objc func recirculationTrackEligible(_ name: String, links: [[String: Any]]) {
    Recirculation.shared.trackEligible(name: name, links: links.map(Self.toLink))
}
@objc func recirculationTrackImpression(_ name: String, links: [[String: Any]]) {
    Recirculation.shared.trackImpression(name: name, links: links.map(Self.toLink))
}
@objc func recirculationTrackClick(_ name: String, link: [String: Any]) {
    Recirculation.shared.trackClick(name: name, link: Self.toLink(link))
}

private static func toLink(_ dict: [String: Any]) -> RecirculationLink {
    RecirculationLink(
        url: dict["url"] as? String ?? "",
        position: (dict["position"] as? NSNumber)?.intValue ?? 0
    )
}
```

### 4.3 Experiences fetch + serialization

```swift
@objc func experiencesFetch(
    _ filterByType: String?,
    filterByFamily: String?,
    resolve: Bool,
    url: String?,
    resolver: @escaping RCTPromiseResolveBlock,
    rejecter: @escaping RCTPromiseRejectBlock
) {
    let typeFilter = filterByType.flatMap(ExperienceType.init(rawValue:))
    let familyFilter = filterByFamily.flatMap { ExperienceFamily.fromKey($0) == .unknown && $0 != "unknown" ? nil : ExperienceFamily.fromKey($0) }
    Experiences.shared.fetchExperiences(
        filterByType: typeFilter,
        filterByFamily: familyFilter,
        resolve: resolve,
        url: url
    ) { [weak self] experiences in
        guard let self = self else { resolver("[]"); return }
        self.cache(experiences)
        let json = Self.serialize(experiences)
        resolver(json)
    }
}

private static func serialize(_ experiences: [Experience]) -> String {
    let array: [[String: Any]] = experiences.map { e in
        var dict: [String: Any] = [
            "id": e.id,
            "name": e.name,
            "type": e.type.rawValue,
            "family": e.family?.rawValue as Any,
            "placement": e.placement as Any,
            "contentUrl": e.contentUrl as Any,
            "contentType": e.contentType.rawValue,
            "features": e.features as Any,
            "strategy": e.strategy as Any,
            "selectors": e.selectors?.map { ["selector": $0.selector, "strategy": $0.strategy] } as Any,
            "filters": e.filters?.map { ["key": $0.key, "operator": $0.operator.key, "values": $0.values] } as Any,
            "rawJson": e.rawJson,
            "resolvedContent": e.resolvedContent as Any,
        ]
        return dict.mapValues { $0 is NSNull ? NSNull() : $0 }
    }
    if let data = try? JSONSerialization.data(
        withJSONObject: array,
        options: [.fragmentsAllowed]
    ), let s = String(data: data, encoding: .utf8) {
        return s
    }
    return "[]"
}
```

**Serialization caveats:**
- `rawJson` and `features` are `[String: Any]`. `JSONSerialization.isValidJSONObject` must hold, otherwise `data(withJSONObject:)` throws. The native parser already deals only in JSON-shaped values (`String`, `Int`, `Double`, `Bool`, `Array`, `Dictionary`, `NSNull`), so this is safe in practice — but **wrap in a do-try-catch and fall back to omitting the offending key** rather than failing the whole fetch.
- `Optional` Swift values are encoded as `NSNull()` to survive `JSONSerialization`. JS receives `null` and the TS interface declares the field as `T | null`.

### 4.4 Experiences tracking + lazy resolve

```swift
@objc func experiencesTrackEligible(_ experienceId: String, links: [[String: Any]]) {
    guard let exp = cached(experienceId) else { return }
    Experiences.shared.trackEligible(experience: exp, links: links.map(Self.toLink))
}
@objc func experiencesTrackImpression(_ experienceId: String, links: [[String: Any]]) {
    guard let exp = cached(experienceId) else { return }
    Experiences.shared.trackImpression(experience: exp, links: links.map(Self.toLink))
}
@objc func experiencesTrackClick(_ experienceId: String, link: [String: Any]) {
    guard let exp = cached(experienceId) else { return }
    Experiences.shared.trackClick(experience: exp, link: Self.toLink(link))
}
@objc func experiencesTrackClose(_ experienceId: String) {
    guard let exp = cached(experienceId) else { return }
    Experiences.shared.trackClose(experience: exp)
}

@objc func experiencesResolveContent(
    _ experienceId: String,
    resolver: @escaping RCTPromiseResolveBlock,
    rejecter: @escaping RCTPromiseRejectBlock
) {
    guard let exp = cached(experienceId) else { resolver(NSNull()); return }
    exp.resolve { content in resolver(content ?? NSNull()) }
}
```

**Cache miss is silent for tracking, returns null for resolve.** Logging via `os_log` at `.debug` level is acceptable but not required.

### 4.5 QA methods

Straightforward delegation. Sync getters wrap into the resolve block:

```swift
@objc func experiencesGetFrequencyCapCounts(
    _ experienceId: String,
    resolver: @escaping RCTPromiseResolveBlock,
    rejecter: @escaping RCTPromiseRejectBlock
) {
    let counts = Experiences.shared.getFrequencyCapCounts(experienceId: experienceId)
    resolver(counts)
}
```

`Dictionary<String, Int>` is bridge-safe; no JSON-string round-trip needed because the values are `Int`, not `Any`.

### 4.6 `ios/MarfeelSdk.m` — RCT_EXTERN_METHOD declarations

Add 17 `RCT_EXTERN_METHOD(...)` lines mirroring the Swift `@objc` signatures. Promise variants use the standard `(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject` tail.

Example:
```objc
RCT_EXTERN_METHOD(experiencesFetch:(NSString *)filterByType
                  filterByFamily:(NSString *)filterByFamily
                  resolve:(BOOL)resolve
                  url:(NSString *)url
                  resolver:(RCTPromiseResolveBlock)resolver
                  rejecter:(RCTPromiseRejectBlock)rejecter)
RCT_EXTERN_METHOD(experiencesTrackImpression:(NSString *)experienceId
                  links:(NSArray *)links)
```

---

## Phase 5: Android bridge

### 5.1 `MarfeelSdkModule.kt` — add experienceCache + coroutine scope

```kotlin
private val experienceCache = ConcurrentHashMap<String, Experience>()
private val experiencesScope = CoroutineScope(Dispatchers.IO + SupervisorJob())

private fun cache(experiences: List<Experience>) {
    experiences.forEach { experienceCache[it.id] = it }
}
```

Add `experienceCache.clear()` to `stopTracking` after the existing call.

### 5.2 Recirculation methods (no main-thread dispatch needed unless verified)

```kotlin
@ReactMethod
fun recirculationTrackEligible(name: String, links: ReadableArray) {
    Recirculation.getInstance().trackEligible(name, links.toLinks())
}
@ReactMethod
fun recirculationTrackImpression(name: String, links: ReadableArray) {
    Recirculation.getInstance().trackImpression(name, links.toLinks())
}
@ReactMethod
fun recirculationTrackClick(name: String, link: ReadableMap) {
    Recirculation.getInstance().trackClick(name, link.toLink())
}

private fun ReadableArray.toLinks(): List<RecirculationLink> = buildList {
    for (i in 0 until size()) getMap(i)?.let { add(it.toLink()) }
}
private fun ReadableMap.toLink() = RecirculationLink(
    url = getString("url") ?: "",
    position = if (hasKey("position")) getInt("position") else 0
)
```

### 5.3 Experiences fetch (suspend → Promise)

```kotlin
@ReactMethod
fun experiencesFetch(
    filterByType: String?,
    filterByFamily: String?,
    resolve: Boolean,
    url: String?,
    promise: Promise
) {
    experiencesScope.launch {
        try {
            val typeFilter = filterByType?.let { ExperienceType.fromKey(it) }
            val familyFilter = filterByFamily?.let { ExperienceFamily.fromKey(it) }
            val list = Experiences.getInstance().fetchExperiences(
                filterByType = typeFilter,
                filterByFamily = familyFilter,
                resolve = resolve,
                url = url
            )
            cache(list)
            promise.resolve(serialize(list))
        } catch (e: Exception) {
            promise.reject("EXPERIENCES_FETCH", e.message, e)
        }
    }
}

private fun serialize(experiences: List<Experience>): String {
    val arr = JSONArray()
    experiences.forEach { e ->
        val o = JSONObject()
        o.put("id", e.id)
        o.put("name", e.name)
        o.put("type", e.type.key)
        o.put("family", e.family?.key ?: JSONObject.NULL)
        o.put("placement", e.placement ?: JSONObject.NULL)
        o.put("contentUrl", e.contentUrl ?: JSONObject.NULL)
        o.put("contentType", e.contentType.key)
        o.put("features", e.features?.let { JSONObject(it) } ?: JSONObject.NULL)
        o.put("strategy", e.strategy ?: JSONObject.NULL)
        o.put("selectors", e.selectors?.let { sels ->
            JSONArray().apply { sels.forEach { put(JSONObject().put("selector", it.selector).put("strategy", it.strategy)) } }
        } ?: JSONObject.NULL)
        o.put("filters", e.filters?.let { fs ->
            JSONArray().apply { fs.forEach { put(JSONObject().put("key", it.key).put("operator", it.operator).put("values", JSONArray(it.values))) } }
        } ?: JSONObject.NULL)
        o.put("rawJson", JSONObject(e.rawJson))
        o.put("resolvedContent", e.resolvedContent ?: JSONObject.NULL)
        arr.put(o)
    }
    return arr.toString()
}
```

### 5.4 Experiences tracking + lazy resolve

```kotlin
@ReactMethod
fun experiencesTrackImpression(experienceId: String, links: ReadableArray) {
    val exp = experienceCache[experienceId] ?: return
    Experiences.getInstance().trackImpression(exp, links.toLinks())
}
@ReactMethod
fun experiencesTrackClose(experienceId: String) {
    val exp = experienceCache[experienceId] ?: return
    Experiences.getInstance().trackClose(exp)
}
@ReactMethod
fun experiencesResolveContent(experienceId: String, promise: Promise) {
    val exp = experienceCache[experienceId] ?: run { promise.resolve(null); return }
    experiencesScope.launch {
        try { promise.resolve(exp.resolve()) }
        catch (e: Exception) { promise.reject("EXPERIENCES_RESOLVE", e.message, e) }
    }
}
```

### 5.5 QA methods

Delegate. Map → `WritableMap` conversion via existing utility patterns or build inline:

```kotlin
@ReactMethod
fun experiencesGetFrequencyCapCounts(experienceId: String, promise: Promise) {
    val counts = Experiences.getInstance().getFrequencyCapCounts(experienceId)
    val map = Arguments.createMap()
    counts.forEach { (k, v) -> map.putDouble(k, v.toDouble()) }   // Long → Double for JS number
    promise.resolve(map)
}
```

**Important: Android `getFrequencyCapCounts` returns `Map<String, Long>`** — JS numbers are 64-bit floats but lose precision above 2^53. Counter values realistically stay well below this; using `putDouble` is safe. iOS returns `Map<String, Int>` via the SDK signature; aligned at the JS contract as `Record<string, number>`.

---

## Phase 6: Tests (vitest)

### 6.1 Update `src/__tests__/react-native-mock.ts`
Add `vi.fn()` for each new native method; for `experiencesFetch` set `mockResolvedValue('[]')`, for getters return appropriate defaults.

### 6.2 `src/__tests__/Recirculation.test.ts`
- `trackEligible/trackImpression/trackClick` forward to native with correct args
- single-link `trackImpression(name, link)` is wrapped to `[link]` before reaching native

### 6.3 `src/__tests__/Experiences.test.ts`
- `fetchExperiences()` forwards null filters when no options
- `fetchExperiences({ filterByType, filterByFamily, resolve, url })` forwards each
- `fetchExperiences` parses native JSON string into typed `Experience[]`
- `idOf` accepts both `Experience` object and string id (snapshot a fixture experience and pass it in)
- QA getters resolve to mocked values

### 6.4 What is **not** tested in this repo
- Wire format with the server (`uexp`, `red`, `trg`, recirculation POST body, position-as-string, "elegible" spelling) — already covered by the iOS and Android SDK test suites
- ISO week semantics, frequency-cap rollover, experiment weight assignment — same
- Bundle/jukebox content fetch — same
- Whole-module sentinel — same

The RN bridge test surface is **only**: argument forwarding, JSON round-trip, ID/object polymorphism.

---

## Phase 7: Example app demo screen

`example/src/screens/ExperiencesScreen.tsx`. Wire into the existing nav stack in `example/src/navigation/types.ts`.

Sections:
1. **Targeting**: text inputs for key/value, "Add targeting" button → `Experiences.addTargeting`
2. **Fetch**: type dropdown (or text input), family dropdown, resolve toggle, optional url override → `await Experiences.fetchExperiences(...)` → render results
3. **Per-experience row**: id, name, type, family, contentUrl. Buttons:
   - Track Eligible (with stub links)
   - Track Impression
   - Track Click
   - Track Close
   - Resolve content (calls `Experiences.resolveContent` and shows result)
4. **Recirculation manual**: name input, links list editor, three event buttons
5. **QA panel**:
   - View frequency-cap counts (per id) / config
   - View experiment assignments
   - Set experiment assignment (groupId + variantId inputs)
   - View read editorials
   - Clear-all buttons for each store

---

## Phase 8: Android module integration

The `MarfeelSdkPackage` (`android/src/main/java/com/marfeel/reactnative/MarfeelSdkPackage.kt`) **does not need changes** — it already returns `MarfeelSdkModule(reactContext)`, which now exposes the new methods.

Verify the consuming app imports the SDK from a Maven repository that contains the `experiences-api` branch's published artifact. Currently `MarfeelSDK-ReactNative/CLAUDE.md` documents `com.marfeel.compass:views:1.16.6`. The Experiences/Recirculation classes were added on `experiences-api` and may not yet be in `1.16.6`. **Bump `compileOnly`/`implementation` to the version that ships the new APIs** — confirm with the Android team. If the version isn't published, the bridge won't compile.

Same concern on iOS: podspec pins `MarfeelSDK-iOS, "~> 2.18"`. Verify the published `~> 2.18.x` includes the Experiences module. If a newer major (`~> 2.19`) is required, bump the podspec.

---

## Phase 9: Implementation order

1. **Verify SDK availability** — confirm the iOS/Android artifacts that ship Experiences are reachable from this repo's dependency declarations. Bump versions if not. **This blocks everything else.**
2. **TS types** (`types.ts` additions) — pure, no runtime dependency
3. **NativeMarfeelSdk interface** signatures — typing only
4. **iOS bridge** — `MarfeelSdk.swift` + `MarfeelSdk.m`. Build `example/ios` to verify linker.
5. **Android bridge** — `MarfeelSdkModule.kt`. Build `example/android` to verify.
6. **Public TS API** — `Experiences.ts`, `Recirculation.ts`, `index.ts` re-exports
7. **Mock + tests** — `react-native-mock.ts` updates, `Experiences.test.ts`, `Recirculation.test.ts`
8. **Example screen** — wire into nav, manual smoke test on both platforms
9. **`npm run typescript` + `npm run lint` + `npm test`** — CI hygiene
10. **README update** — add a brief "Experiences & Recirculation" section to `README.md`

---

## Open questions to resolve before / during implementation

| Question | How to resolve |
|----------|----------------|
| Does the iOS Experiences/Recirculation singleton touch UIKit / lifecycle? | Skim `Experiences.swift`, `Recirculation.swift`, `RecirculationApiClient.swift`. If not, no main-thread dispatch needed. (Quick read suggests **no** — it's all `URLSession`, `UserDefaults`, in-memory state.) |
| Same on Android: any `Looper`/`Activity` requirement? | Skim `Experiences.kt`, `Recirculation.kt`, `WholeModuleAugmenter`. (Same — pure data + coroutines + OkHttp via existing API client.) |
| iOS pod version that ships Experiences | Ask iOS team or check the SDK's release notes. The `ios_impl_plan.md` predates a release tag. |
| Android compass-views version that ships `experiences-api` | Same — confirm with Android team. |
| Should `addTargeting` be exposed on `Recirculation` too? | iOS doesn't expose it on `Recirculation`. Android doesn't either. **Don't add it to RN.** |
| Is `experiencesGetFrequencyCapCounts` value type `Int` (iOS) vs `Long` (Android) a JS-side concern? | No, JS represents both as `number`. Realistic counter values are well within `Number.MAX_SAFE_INTEGER`. Document that values >2^53 are unreliable, but unreachable in practice. |
| Should `fetchExperiences` filters accept arrays for AND-of-types / OR-of-families? | Native API is single-value. Keep parity. |
| Cache eviction policy beyond `stopTracking` | None. Bounded by server id space; same id is overwritten on each fetch. If memory becomes an issue, add a max-size LRU later. |

---

## Wire format & SDK parity (out of scope for this repo)

Everything in `ios_impl_plan.md` § "Wire Format Parity" and § "Known Parity Gaps" is **owned by the native SDKs**, not by this bridge. The RN repo has no business serializing `uexp`, `red`, `trg`, or recirculation POST bodies — it just calls the native `Experiences.shared.fetchExperiences(...)` / `Recirculation.shared.trackImpression(...)` and trusts the SDK to honor those formats.

---

## Summary of total surface area added

| Layer | Files touched | Methods added |
|-------|---------------|---------------|
| TS public API | 2 new (`Experiences.ts`, `Recirculation.ts`), 2 updated (`types.ts`, `index.ts`) | 18 public functions |
| Native bridge interface | 1 updated (`NativeMarfeelSdk.ts`) | 17 method signatures |
| iOS bridge | 2 updated (`MarfeelSdk.swift`, `MarfeelSdk.m`) | 17 `@objc` methods, 17 `RCT_EXTERN_METHOD` decls, ~80 lines of serialization helper |
| Android bridge | 1 updated (`MarfeelSdkModule.kt`) | 17 `@ReactMethod`, ~80 lines of serialization helper |
| Tests | 1 updated (`react-native-mock.ts`), 2 new (`Experiences.test.ts`, `Recirculation.test.ts`) | ~20 tests |
| Example | 1 new screen, 1 nav update | — |

No new dependencies. No native SDK changes. Bridge-only.
