# CDP module — React Native bridge implementation plan

Expose the Marfeel CDP subsystem (identity / RFV / cohorts / properties / segments /
meters) through the React Native SDK, matching the behaviour described in
`CompassTracker/src/cdp/implementation-reviewed.md` and the contract in `cdp-api.md`.

## Key realisation: this is a bridge port, not a logic port

The CDP **business logic already exists and ships inside both native SDKs**:

- **Android** — `com.marfeel.compass.cdp.*`, public facade `Cdp.getInstance()`
  (`Cdp.kt`), models in `cdp/model/`.
- **iOS** — `CompassSDK/CDP/`, public facade `Cdp.shared` (`Cdp.swift`),
  models in `CDP/Models/`.

All the hard parts described in the implementation guide — fail-open networking, the
identity state machine, per-`master_id` mirror stores, 180-day TTL, segment
carry-over, meter stale-while-revalidate, consent gating, beacon-field attachment,
session-start re-resolution — are **owned by the native SDKs**. The RN repo is a thin
`NativeModules` bridge (same as `CompassTracking` / `Experiences` / `MultimediaTracking`).

**Therefore the RN task is purely:**
1. Thread a new `enableCdp` opt-in through `initialize`.
2. Surface the CDP public methods across the JS↔native boundary on both platforms.
3. Add the JS public API (`Cdp` object), the `NativeMarfeelSdk` interface entries,
   types, and tests.

The invariants checklist in the guide is satisfied by the native layer — the RN
bridge only has to forward calls faithfully and serialise/deserialise correctly.

## Prerequisite / risk: native SDK versions must include the CDP

The bridge calls the native CDP facades, so the pinned native dependencies must be
versions that contain CDP:

- Android: `android/build.gradle` → `com.marfeel.compass:views:1.17.0`
- iOS: `marfeel-react-native-sdk.podspec` → `MarfeelSDK-iOS ~> 2.18.9`

**Action:** confirm the published `views` artifact and the `MarfeelSDK-iOS` pod at
these versions export `Cdp` / `CdpData` / `MeterState` and the `enableCdp` overload of
`initialize`. If not, bump to the first releases that do **before** wiring the bridge.
This is the single external dependency of the whole task.

## Native public surface being bridged

Mirror of what each native facade exposes (verified in the SDK sources):

| Concept | Android (`Cdp`) | iOS (`Cdp.shared`) |
|---|---|---|
| Link identifier | `cdpDoIdentityLink(type, value, isDeterministic=false)` | `cdpDoIdentityLink(type:value:isDeterministic:)` |
| Beacon data | `getCdpData(serialized=false): CdpData` | `getCdpData() -> CdpData` (has `rfvSerialized`/`cohortsSerialized` computed) |
| Master id | `getCdpMasterId(): String?` | `getCdpMasterId() -> String?` |
| Segments | `addCdpSegment` / `removeCdpSegment` / `setCdpSegments(List)` / `clearCdpSegments` / `getCdpSegments(): List<String>` | same names; `setCdpSegments([String])` |
| Meter snapshot | `suspend getMeterSnapshot(): List<MeterState>` | `getMeterSnapshot(completion:)` |
| Meter read (sync) | `getMeter(name): MeterState?` / `listMeters(): List<MeterState>` | `getMeter(_:) -> MeterState?` / `listMeters() -> [MeterState]` |
| Increment | `suspend incrementMeter(name): MeterState?` (throws `MeterNotFoundError`) | `incrementMeter(_:completion:)` → `Result<MeterState?, Error>` (`.failure(MeterNotFoundError)`) |
| Init opt-in | `CompassTracking.initialize(context, accountId, tech, enableCdp=false)` | `CompassTracker.initialize(accountId:pageTechnology:endpoint:enableCdp:)` |

Identity resolution, session-start re-resolution, consent-change handling and
`setSiteUserId` → `registered_user_id` linking are **driven internally by the native
trackers** — the bridge does not need to wire them. The existing RN `setConsent` and
`setSiteUserId` already reach the native trackers, which already notify the CDP.

`MeterState` shape (both platforms): `name`, `count`, optional `threshold` / `reached`
/ `remaining` trio (present only when a threshold is configured — preserve absent),
`startedAt?` / `expiresAt?` (`Date`), `window { duration, period, tz }`.

## JS public API design (`src/Cdp.ts`)

New `Cdp` object exported from `index.ts`, following the `Experiences` pattern.
Because the object is already `Cdp.`-namespaced, drop the redundant `cdp` prefix from
methods (keep parity with the documented public surface in `cdp-api.md` §11):

```ts
export const Cdp = {
  linkIdentity(type: string, value: string, isDeterministic = false): void
  getData(): Promise<CdpData>            // { masterId, rfv, cohorts }
  getMasterId(): Promise<string | null>
  addSegment(segment: string): void
  removeSegment(segment: string): void
  setSegments(segments: string[]): void
  clearSegments(): void
  getSegments(): Promise<string[]>
  getMeterSnapshot(): Promise<MeterState[]>
  getMeter(name: string): Promise<MeterState | null>
  listMeters(): Promise<MeterState[]>
  incrementMeter(name: string): Promise<MeterState | null>  // rejects MeterNotFoundError
}
```

Rationale for `Promise` on the sync native getters (`getMasterId`, `getSegments`,
`getMeter`, `listMeters`): the RN Old-Architecture bridge is asynchronous; any method
returning a value must use a Promise. This matches the existing `getUserId` / `getRFV`
/ Experiences getters.

### New types (`src/types.ts`)

```ts
export interface CdpRfv { rfv: number; r: number; f: number; v: number }

export interface CdpData {
  masterId: string | null;
  rfv: CdpRfv | null;
  cohorts: number[];
}

export interface MeterWindow { duration: string; period: string; tz: string }

export interface MeterState {
  name: string;
  count: number;
  threshold?: number;      // present only when configured
  reached?: boolean;
  remaining?: number;
  startedAt?: string;      // ISO-8601, omitted when null
  expiresAt?: string;      // ISO-8601, omitted when null
  window: MeterWindow;
}
```

`startedAt` / `expiresAt` are surfaced as ISO-8601 strings (the wire form); consumers
parse to `Date` if needed. Keep `threshold`/`reached`/`remaining` optional and **omit
them when the native value is null** so the absent-vs-present distinction survives.

### Serialisation strategy across the bridge

Reuse the established repo pattern: native side serialises complex values to a JSON
**string**, JS parses it (`getRFV`, `fetchExperiences` already do this). So:

- `getData` → native returns a JSON string `{ "masterId", "rfv"|null, "cohorts":[] }`;
  JS `JSON.parse`. (Use the model fields directly; do not need the `*Serialized`
  beacon forms here — those are for the native ingest payload.)
- `getMeterSnapshot` / `listMeters` → JSON string of a `MeterState[]`.
- `getMeter` → JSON string of one `MeterState` or `null`.
- `incrementMeter` → JSON string of `MeterState` or `null`; on `MeterNotFoundError`
  the native side rejects the promise with code `"METER_NOT_FOUND"`.

Meter JSON builder (native): omit `threshold`/`reached`/`remaining` when null; format
`startedAt`/`expiresAt` as ISO-8601 and omit when null; always include `window`.

## `NativeMarfeelSdk.ts` additions

Add to `NativeMarfeelSdkType`:

```ts
initialize(accountId: string, pageTechnology: number | null, enableCdp: boolean): void;

cdpLinkIdentity(type: string, value: string, isDeterministic: boolean): void;
cdpGetData(): Promise<string>;            // JSON string
cdpGetMasterId(): Promise<string | null>;
cdpAddSegment(segment: string): void;
cdpRemoveSegment(segment: string): void;
cdpSetSegments(segments: string[]): void;
cdpClearSegments(): void;
cdpGetSegments(): Promise<string[]>;
cdpGetMeterSnapshot(): Promise<string>;   // JSON string MeterState[]
cdpGetMeter(name: string): Promise<string | null>;
cdpListMeters(): Promise<string>;         // JSON string MeterState[]
cdpIncrementMeter(name: string): Promise<string | null>;
```

`initialize` gains the `enableCdp` arg; update `CompassTracking.initialize` to accept
and forward it (see below).

## `CompassTracking.initialize` change

Extend the public TS entry point without breaking callers:

```ts
initialize(accountId: string, pageTechnology?: number, options?: { enableCdp?: boolean }): void {
  NativeMarfeelSdk.initialize(accountId, pageTechnology ?? null, options?.enableCdp ?? false);
}
```

## Android bridge (`MarfeelSdkModule.kt`)

- Update `initialize` to take `enableCdp: Boolean` and call
  `CompassTracking.initialize(context, accountId, enableCdp = enableCdp)` (named arg;
  `tech` keeps its default) — or pass `pageTechnology` too when provided.
- Add `@ReactMethod`s under a `// region CDP` block, all dispatched via the existing
  `runOnMainThread { }` helper for the void calls, and via `experiencesScope.launch { }`
  (IO coroutine) for the `suspend` meter calls + promise-returning getters:
  - `cdpLinkIdentity(type, value, isDeterministic)` → `Cdp.getInstance().cdpDoIdentityLink(...)`
  - `cdpGetData(promise)` → build JSON from `Cdp.getInstance().getCdpData()` (`masterId`,
    `rfv` object or `JSONObject.NULL`, `cohorts` `JSONArray`).
  - `cdpGetMasterId(promise)` → `promise.resolve(Cdp.getInstance().getCdpMasterId())`.
  - `cdpAddSegment` / `cdpRemoveSegment` / `cdpSetSegments(ReadableArray)` /
    `cdpClearSegments` → forward (reuse the `ReadableArray`→`List<String>` loop from
    `setUserSegments`).
  - `cdpGetSegments(promise)` → push `getCdpSegments()` into a `WritableArray`.
  - `cdpGetMeterSnapshot(promise)` → `launch { resolve(serializeMeters(Cdp...getMeterSnapshot())) }`.
  - `cdpGetMeter(name, promise)` → `Cdp.getInstance().getMeter(name)` → JSON or null.
  - `cdpListMeters(promise)` → `serializeMeters(Cdp.getInstance().listMeters())`.
  - `cdpIncrementMeter(name, promise)` →
    `launch { try { resolve(serializeMeter(Cdp...increment(name))) } catch (e: MeterNotFoundError) { promise.reject("METER_NOT_FOUND", e.message) } }`.
- Add a `serializeMeters(List<MeterState>)` / `serializeMeter(MeterState?)` helper
  (org.json), omitting the null threshold trio and ISO-formatting the `Date` fields
  (`CdpDates`-style; a `SimpleDateFormat` with `yyyy-MM-dd'T'HH:mm:ss.SSS'Z'` UTC, or
  reuse the SDK's formatter if exported).
- Imports: `com.marfeel.compass.cdp.Cdp`, `...cdp.model.MeterState`,
  `...cdp.model.MeterNotFoundError`, `...cdp.model.CdpData`.

## iOS bridge (`MarfeelSdk.swift` + `MarfeelSdk.m`)

- Update `initialize(_:pageTechnology:enableCdp:)` to call
  `CompassTracker.initialize(accountId: accountIdInt, pageTechnology: tech, enableCdp: enableCdp)`.
- Add `@objc` methods (Swift) + matching `RCT_EXTERN_METHOD` declarations (`.m`):
  - `cdpLinkIdentity(_:value:isDeterministic:)` → `Cdp.shared.cdpDoIdentityLink(...)`
  - `cdpGetData(_:reject:)` → JSON string from `Cdp.shared.getCdpData()`
    (`masterId`, `rfv` dict or `NSNull`, `cohorts`).
  - `cdpGetMasterId(_:reject:)` → resolve `getCdpMasterId()` (or `NSNull`).
  - `cdpAddSegment` / `cdpRemoveSegment` / `cdpSetSegments(_: [String])` /
    `cdpClearSegments` → forward.
  - `cdpGetSegments(_:reject:)` → resolve `getCdpSegments()` array.
  - `cdpGetMeterSnapshot(_:reject:)` → `Cdp.shared.getMeterSnapshot { resolve(serialize($0)) }`.
  - `cdpGetMeter(_:resolver:reject:)` → serialise one or `NSNull`.
  - `cdpListMeters(_:reject:)` → serialise `listMeters()`.
  - `cdpIncrementMeter(_:resolver:reject:)` →
    `incrementMeter(name) { result in switch result { case .success(let m): resolve(serialize(m)); case .failure: reject("METER_NOT_FOUND", ...) } }`.
- Add a `serializeMeters([MeterState]) -> String` / `serializeMeter(MeterState?)`
  helper (`JSONSerialization`), omitting the null threshold trio and ISO-formatting
  `Date` via an `ISO8601DateFormatter`.
- `MarfeelSdk.m`: add `RCT_EXTERN_METHOD` for each, and change the `initialize`
  declaration to include `enableCdp:(BOOL)enableCdp`.

## `index.ts`

```ts
export { Cdp } from './Cdp';
export type { CdpData, CdpRfv, MeterState, MeterWindow } from './types';
```

## Tests (`src/__tests__/Cdp.test.ts`)

Follow `Experiences.test.ts` / the `react-native-mock.ts` `vi.fn()` stub pattern:

- `linkIdentity` / segment mutators forward args (incl. `isDeterministic` default false,
  `setSegments` array passthrough).
- `getData` parses the native JSON string into `{ masterId, rfv, cohorts }`; handles the
  null-rfv / empty-cohorts case.
- `getMeterSnapshot` / `listMeters` parse a `MeterState[]`; a meter without a threshold
  has no `threshold`/`reached`/`remaining` keys; one with a threshold keeps them.
- `getMeter` returns `null` when native resolves null.
- `incrementMeter` resolves a `MeterState`; rejects when native rejects with
  `METER_NOT_FOUND`.
- `getMasterId` / `getSegments` resolve native values.
- `CompassTracking.initialize` forwards `enableCdp` (default `false` when omitted).

Add the new method stubs to `src/__tests__/react-native-mock.ts`.

## README

Add a `Cdp` section documenting `enableCdp` opt-in (requires personalization consent
via `setConsent`), the identity-link / segment / meter API, and that meters are
stale-while-revalidate + fail-open. Note that identity resolution is automatic.

## Build order

1. Confirm/bump native SDK versions that ship CDP (prerequisite).
2. `src/types.ts` (CdpData, CdpRfv, MeterState, MeterWindow).
3. `src/NativeMarfeelSdk.ts` interface entries + `initialize` arg.
4. `src/Cdp.ts` + `CompassTracking.initialize` change + `index.ts` exports.
5. Android `MarfeelSdkModule.kt` bridge methods + meter serialiser.
6. iOS `MarfeelSdk.swift` + `MarfeelSdk.m` bridge methods + meter serialiser.
7. Tests + `react-native-mock.ts` stubs; `npm test`, `npm run typescript`, `npm run lint`.
8. Manual end-to-end check in `example/` (enable CDP, grant consent, link identity,
   set segments, read/increment a meter).

## Out of scope (handled natively — do not re-implement in RN)

Fail-open networking, identity state machine + memoisation, per-`master_id` mirror
stores + 180-day TTL, UUID validate-on-read, segment local-first + carry-over,
reconcile, meter SWR/seed/dedup, `MeterNotFoundError` raising, consent gating,
session-start re-resolution, and `cdp_mid`/`cdp_rfv`/`cdp_cohorts` beacon attachment.
</content>
</invoke>
