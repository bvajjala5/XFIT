# Android wrapper

The browser app and installable PWA remain the primary product. This folder adds a
Capacitor shell so the same app can be offered in Google Play later.

**Current state:** a signed release AAB (`versionCode 3`) has been built on this
machine and uploaded to Play closed testing as `Closed test 1.0`. Version codes 1
and 2 are already published to internal testing. The AAB is generated output
(git-ignored), so rebuild it from source if you move to another machine.

Everything below is editable before the first release. The package ID is the one
thing that becomes effectively permanent once the app is published.

## Current metadata

| Field | Value |
| --- | --- |
| Package ID | `com.uttar.fitness` |
| App name | Uttar Fitness |
| Web URL | `https://xfit-bpe.pages.dev` |
| Support email | `bhanu.charan.vajjala@gmail.com` |
| Privacy policy | `https://xfit-bpe.pages.dev/privacy` |
| Data deletion URL | `https://xfit-bpe.pages.dev/privacy` |
| Target API | 36 (Android 16), required for new Play submissions since Aug 31, 2026 |

The Gradle plugin is 8.9.1 and the wrapper is Gradle 8.11.1, which support API 36.
Those values are set in `android/build.gradle` and `android/variables.gradle` and
were compiled successfully. Capacitor 7 requires **JDK 21** (JDK 17 fails with
`invalid source release: 21`).

The wrapper bundles `dist` locally instead of loading the live PWA URL. Native
Google sign-in now calls the Capacitor bridge directly from the main JS bundle;
a `server.url` pointing at the deployed site made the WebView load the public
bundle and skip native auth fixes, so keep it out of `capacitor.config.json`.
The public website remains at the URL above and is unchanged.

## What is already wired

- `capacitor.config.json` — app ID, app name, local web assets, and OAuth navigation allowlist.
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

## Native-only behaviour

The packaged app opens straight to `/login` for signed-out users; the public
website keeps its landing page. On native, Google sign-in uses the system Google
account picker through `@capacitor-firebase/authentication`, then passes the
returned ID token to the Firebase JS SDK so the rest of the app keeps using one
auth state. This avoids the WebView OAuth handoff that Google rejects with a
malformed-request error. `AuthContext` registers the bridge from `@capacitor/core`
instead of lazily importing the plugin JS, so the native call cannot stall behind
a missing chunk. The launch icon and splash screen are generated from
`public/icons/icon-512.png` by `scripts/generate-android-assets.mjs`, which runs
at the end of `npm run cap:sync`.

Firebase has an Android app registered as `com.uttar.fitness`, and
`android/app/google-services.json` is downloaded from it. All four SHA-1
certificate fingerprints are registered there so both locally signed and
Play-signed builds can use Google sign-in:

- Upload key: `A5:01:B1:CA:0C:00:01:A3:EE:E2:4C:E0:7E:D0:C4:7F:8C:22:C0:64`
- Play previous app signing key: `98:FA:10:5A:6E:A5:B2:A4:9F:4C:CE:89:32:62:80:68:CB:66:3F:20`
- Play current classical key: `14:1A:DF:D7:DD:E6:FA:41:9F:1C:A8:B3:B7:7F:CC:F9:17:BC:99:BD`
- Play post-quantum key: `37:F6:09:C0:E1:09:76:EF:3D:6C:69:75:60:7B:97:EC:AE:09:C0:F8`

Play enabled quantum-ready hybrid signing, so there are three app-signing keys
rather than one. All three are registered; refresh `google-services.json` from
Firebase console → Project settings → Your apps if another key is added. Without
these fingerprints, Play-installed builds cannot sign in.

Native Google sign-in was verified on the local Android emulator with the
reviewer account `uttarfitness5@gmail.com`: the system account sheet appears,
the ID token is handed to Firebase JS, and the app opens the signed-in Home
screen. Earlier BrowserStack/emulator hangs were caused by the WebView loading
the deployed site instead of the bundled native assets. No password was pasted
into chat or automation.

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
cd android && ./gradlew clean bundleRelease assembleRelease --no-daemon
```

Result: `android/app/build/outputs/bundle/release/app-release.aab`
(SHA-256
`3f6b35046ab44f260f7cecfcfebe281b03fc19f47dcb4af176e02da69db75f1e`,
`versionCode 3`) and `android/app/build/outputs/apk/release/app-release.apk`
(SHA-256 `b7f6a524cdba2116a6997e74f14963cdcf887a2e9d8cb0b5d42cdea8f4a90a61`).
The AAB signer was checked with `keytool -printcert -jarfile`; the APK's v2
signature was checked with `apksigner verify`. Android Studio is **not** required
for this command. Always use `clean`; interrupted builds left duplicate resource
files with spaces in their names, which otherwise fail resource validation.

To upload from Android Studio instead, use **Build → Generate Signed Bundle /
APK → Android App Bundle** and select the release signing config.

Before creating the Play app, decide whether to keep this upload key. Enrolling in
Play App Signing means Google replaces it with the app-signing key after the first
upload, but the upload key must still be kept safe.

`public/.well-known/assetlinks.json` lists the local release upload certificate
above and all three Play app-signing certificates from Play Console → Protected
with Play → Play Store protection → Manage Play app signing, so App Links and a
TWA verify in local/device testing and with Play-signed builds. Keep all entries:
Play signs updates with its app-signing keys, not the upload key.

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
