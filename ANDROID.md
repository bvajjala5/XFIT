# Android wrapper

The browser app and installable PWA remain the primary product. This folder adds a
Capacitor shell so the same app can be offered in Google Play later.

**Current state:** wrapper source/config is ready, but no Android SDK is installed
here, so no APK/AAB has been built and nothing has been uploaded to Play Console.

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

## Before building a release

1. Install Android Studio with an Android SDK and accept its licenses.
2. Create a Play Console account and a new app using `com.uttar.fitness`.
3. Generate an upload key (keep this file safe; you cannot update the app without it):

   ```bash
   keytool -genkeypair -v \
     -keystore "$HOME/keys/uttar-fitness-release.jks" \
     -alias uttar-fitness -keyalg RSA -keysize 2048 -validity 10000
   ```

4. Copy the signing template and fill in real values locally:

   ```bash
   cp android/keystore.properties.example android/keystore.properties
   ```

   Set `storeFile` to the absolute path of the `.jks` file. Both
   `android/keystore.properties` and the keystore are git-ignored.

5. In Android Studio: **Build → Generate Signed Bundle / APK → Android App Bundle**,
   select the release signing config, and build the `.aab` from `android/app/release/`.

## Play Console listing

- Support email: the account you want users to contact.
- Privacy policy and data deletion URL: `https://xfit-bpe.pages.dev/privacy`.
- Data safety: Firebase handles sign-in and saved app data; food searches use USDA
  and Open Food Facts; camera frames are checked on-device and never stored; GPS is
  used only while the user runs and the app is open.
- Note that Form Check needs camera access and runs need location access. Neither
  permission is required to use the rest of the app.

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
