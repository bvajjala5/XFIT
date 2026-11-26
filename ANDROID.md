# Android wrapper

The browser app and installable PWA remain the primary product. This folder adds a
Capacitor shell so the same app can be offered in Google Play later.

**Current state:** a signed release AAB has been built on this machine and is ready
to upload. Nothing has been submitted to Play Console. The AAB is generated output
(git-ignored), so rebuild it from source if you move to another machine.

Everything below is editable before the first release. The package ID is the one
thing that becomes effectively permanent once the app is published.

## Current metadata

| Field | Value |
| --- | --- |
| Package ID | `com.uttar.fitness` |
| App name | Uttar Fitness |
| Web URL | `https://xfit-bpe.pages.dev` |
| Support email | the Google account already used for sign-in |
| Privacy policy | `https://xfit-bpe.pages.dev/privacy` |
| Data deletion URL | `https://xfit-bpe.pages.dev/privacy` |
| Target API | 36 (Android 16), required for new Play submissions since Aug 31, 2026 |

The Gradle plugin is 8.9.1 and the wrapper is Gradle 8.11.1, which support API 36.
Those values are set in `android/build.gradle` and `android/variables.gradle` and
were compiled successfully. Capacitor 7 requires **JDK 21** (JDK 17 fails with
`invalid source release: 21`).

The wrapper loads the live PWA URL instead of a bundled copy of `dist`. That keeps
Google sign-in on the Firebase-authorized domain. It also means the app needs a
network connection for fresh data; the PWA service worker still provides offline
app-shell caching inside the WebView.

## What is already wired

- `capacitor.config.json` — app ID, app name, live URL, and OAuth navigation allowlist.
- `android/` — generated Capacitor Android project.
- `android/app/src/main/AndroidManifest.xml` — INTERNET, CAMERA, and coarse/fine location permissions.
- `android/app/build.gradle` — optional release signing from an untracked `android/keystore.properties`.
- `android/.gitignore` — ignores built web assets, local SDK config, keystores, and signing passwords.

## Local commands

```bash
npm install
npm run build
npm run cap:sync          # rebuilds dist, then copies config/plugins to android/
npm run cap:open:android  # opens the native project in Android Studio
```

`npm run cap:sync` is safe to rerun after any web change.

## Known limitation to verify on device

The web app signs in with Firebase's `signInWithPopup`. Android WebViews do not
always open that popup. If Google sign-in does not work in the wrapper, switch
that call to `signInWithRedirect` (or use `@capacitor/browser`) before release.
The OAuth domains are already in the `capacitor.config.json` allowlist.

## Release build (already done on this machine)

The local toolchain was installed with Homebrew: `openjdk@21`, the
`android-commandlinetools` cask, and SDK platform 36, build-tools 36.0.0 and
platform-tools under `$HOME/Android/Sdk`. SDK licenses were accepted.

`android/variables.gradle` sets `minSdkVersion = 24`. Play automatic protection
rejects bundles below API 24, so keep this minimum for store uploads.

An upload key and local signing config were created:

- Keystore: `$HOME/keys/uttar-fitness-release.jks` (git-ignored)
- Alias: `uttar-fitness`, SHA-256 fingerprint
  `EF:55:7A:27:23:51:A4:1C:B3:F2:D6:A9:E1:CD:EC:E6:B8:C1:53:BB:04:B9:44:6B:56:C1:11:95:7E:9C:00:F6`
  (valid until 2054; **back this file up** — it is required for every future update)
- Passwords: in `android/keystore.properties` (git-ignored)

The signed bundle was built with:

```bash
export JAVA_HOME=/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home
export ANDROID_HOME="$HOME/Android/Sdk" ANDROID_SDK_ROOT="$ANDROID_HOME"
cd android && ./gradlew bundleRelease --no-daemon
```

Result: `android/app/build/outputs/bundle/release/app-release.aab`
(SHA-256
`01fa3795e373d751a3c05fed66cb40a7cc42cc94ae900587f6d4fd65d594937b`).
Signature verified with `jarsigner -verify`. Android Studio is **not** required
for this command.

To upload from Android Studio instead, use **Build → Generate Signed Bundle /
APK → Android App Bundle** and select the release signing config.

Before creating the Play app, decide whether to keep this upload key. Enrolling in
Play App Signing means Google replaces it with the app-signing key after the first
upload, but the upload key must still be kept safe.

`public/.well-known/assetlinks.json` lists both the local release upload
certificate above and the Play App Signing certificate
(`57:D6:E8:C5:7F:1A:26:88:A3:A6:87:0F:66:8D:AC:8D:07:45:C0:3D:F7:70:CE:4C:92:46:6D:9A:3F:2A:F2:FF`)
copied from Play Console → App integrity, so App Links and a TWA verify in
local/device testing and with Play-signed builds. Keep both entries: Play signs
updates with the app signing key, not the upload key.

## Play Console listing

- Support email: the account you want users to contact.
- Privacy policy and data deletion URL: `https://xfit-bpe.pages.dev/privacy`.
- Data safety: Firebase handles sign-in and saved app data; food searches use USDA
  and Open Food Facts; camera frames are checked on-device and never stored; GPS is
  used only while the user runs and the app is open.
- Note that Form Check needs camera access and runs need location access. Neither
  permission is required to use the rest of the app.

## Getting production access

New personal Play Console accounts created after November 13, 2023 cannot publish
to production until they pass a testing gate:

1. Complete the app setup (store listing, content rating, data safety, target
   audience, and pricing).
2. Publish a **closed testing** release to at least **12 testers** who stay opted
   in continuously for **14 days**. Internal testing does not count.
3. Collect feedback through Play Console and fix what testers report.
4. On the Play Console dashboard, choose **Apply for production** and answer the
   questions about your test, audience, and readiness. Google usually responds
   within about a week.
5. Provide a working Google sign-in test account in Play Console so reviewers can
   reach the signed-in screens.

Keep the closed test running while you iterate; updates to an app that already
has production access do not repeat this gate.

## Later: native health data

Health Connect and Apple Health are not wired into the wrapper yet. See
`HEALTH_INTEGRATION.md` for the data scope, permission plan, and phases.

## Device test checklist

- Google sign-in and Export Data from Profile.
- WorkoutPlayer gear menu: Form Check, demo/body map visibility, assistant voice,
  mute, and restart.
- Camera permission and a live Form Check session.
- Location permission and a short GPS run.
- Food source badges and a local-only food correction.
- Dark mode, Light mode, and Auto wallpaper.

## Changing values later

- URL, app name, and allowlist: edit `capacitor.config.json`, then run `npm run cap:sync`.
- Launcher label: edit `android/app/src/main/res/values/strings.xml`.
- Play listing values: edit the Play Console listing directly.
- Package ID: change it now if needed; after the first Play release, treat it as fixed.
