# Native health data — plan

**Current state:** not implemented. The Android Capacitor wrapper source exists,
but there is no Android SDK build here, no iOS project, and no Health Connect or
HealthKit code. This document is the scaffold for doing it later without
guessing at product decisions.

The browser app and PWA stay the primary product. Health data should be opt-in,
read-only at first, and never required to use Uttar Fitness.

## Why this needs native work

- **Health Connect** is an Android system API. It needs a native Android build,
  manifest permissions, and runtime permission requests inside the WebView.
- **Apple Health (HealthKit)** needs an iOS project, an Apple Developer team,
  HealthKit entitlements, usage-description strings, and App Store review.
- Neither can be delivered by the browser build alone.

## Data we would read, and where it goes

| Native record | Normalized app field | Used by |
| --- | --- | --- |
| Steps (daily) | `steps` / health log `steps` | HealthHub, daily step goal |
| Distance (workout or daily) | `distanceMeters` | Run history, weekly distance goal |
| Active energy | `calories_burned` | HealthHub, nutrition balance |
| Workouts / sessions | run or workout-log row | Progress, streak, personal records |

Nothing is written back to Health Connect or HealthKit initially. If a user
imports a native workout, it goes through the same durable save path as GPS and
CSV/GPX/TCX runs, with a stable source id so it cannot be duplicated.

## Privacy rules to keep

1. Ask before requesting any health permission; explain exactly what is read.
2. Read on the device. Do not upload raw health records or store them in a new
   backend collection.
3. Only an explicit user action writes a normalized workout to their existing
   workout log.
4. Show a disconnect/forget control that clears any local health cache.
5. Update the Play Console Data Safety and App Store privacy labels to match:
   health data is read on-device and only imported on request.

## Android: Health Connect

Prerequisites: Android Studio + SDK, a signed build, and a device/emulator with
Health Connect available (Android 14+ or the Health Connect app on older versions).

Native changes required:

- Add Health Connect read permissions to
  `android/app/src/main/AndroidManifest.xml`, for example:
  `android.permission.health.READ_STEPS`,
  `android.permission.health.READ_DISTANCE`,
  `android.permission.health.READ_ACTIVE_CALORIES_BURNED`, and
  `android.permission.health.READ_EXERCISE`.
- Add the standard permission-rationale intent filter to `MainActivity` so the
  system can explain why the app asks for health data.
- Add a Capacitor plugin (a maintained community plugin or a small custom
  native plugin) exposing:

  ```js
  requestPermissions()      // => { granted: [], denied: [] }
  getTodaySnapshot()        // => { steps, distanceMeters, calories, recordedAt }
  getWorkoutsSince(date)    // => normalized workout records
  ```

- Normalize native records in a pure JS helper before they reach app state, so
  the same mapping can be unit-tested without a device.

## iOS: Apple Health / HealthKit

Prerequisites: `npx cap add ios`, Xcode, an Apple Developer team, and a device
for testing. HealthKit does not work in the Simulator.

Native changes required:

- Enable the HealthKit capability and add `NSHealthShareUsageDescription` to
  `Info.plist`. Do not request write authorization for the first release.
- Request read access only for steps, distance, active energy, and workouts.
- Bridge the same three methods as Android, with HealthKit queries for today's
  snapshot and workouts since a date.
- Expect App Store review questions about what is read and why.

## Suggested bridge contract

Keep the native layer small and put all product rules in JS:

```js
// src/lib/healthSync.js (to be added with the native plugin)
export function normalizeHealthSnapshot(record) {
  // => { steps: 0, distanceMeters: 0, calories: 0, recordedAt: ISO string }
}

export function mapHealthWorkouts(records, { unit }) {
  // => same row shape used by csvImport / activityFiles, with source: 'health'
}
```

`mapHealthWorkouts` should reuse the stable-id approach from
`src/lib/csvImport.js` so importing the same Health workout twice is a no-op.

## Phases and acceptance criteria

1. **Scaffold (this document):** agree on data scope and privacy rules. Done.
2. **Android read-only:** Health Connect permission flow, today snapshot shown
   in HealthHub, and workouts imported via the existing save helper.
3. **iOS read-only:** same bridge on HealthKit; verify on a real iPhone.
4. **UI polish:** Connect / Disconnect controls, last-sync time, and clear
   explanations when a permission is denied.
5. **Release:** update store privacy disclosures only after the shipped behavior
   is verified on both platforms.

A phase is done when its data appears correctly in HealthHub and Progress, a
second import creates no duplicates, and denying permissions leaves the rest of
the app usable.

## Related files

- `ANDROID.md` — wrapper setup and release steps
- `src/lib/csvImport.js` — stable-id and row-shape precedent
- `src/lib/runSave.js` — shared save path for imported workouts
- `src/pages/HealthHub.jsx` — where health metrics are displayed
