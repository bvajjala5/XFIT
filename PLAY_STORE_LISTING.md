# Google Play listing draft

Everything here can be pasted into Play Console as-is. Nothing has been submitted.
The signed AAB is built at
`android/app/build/outputs/bundle/release/app-release.aab`. Still needed: a Play
Console account, store screenshots, and a reviewer test account. The 1024×500 feature graphic and 512×512 launcher icon are already in the repo.

## App details

| Field | Value |
| --- | --- |
| App name | Uttar Fitness |
| Package | `com.uttar.fitness` |
| Category | Health & Fitness |
| Tags | fitness, workout, nutrition, running, tracker |
| Content rating | Everyone (complete the questionnaire honestly in Play Console) |
| Price | Free |
| Ads | None |
| Privacy policy | `https://xfit-bpe.pages.dev/privacy` |
| App deletion instructions | Profile → Delete Account, or the privacy policy above |

## Short description (80 character limit)

> Free AI-guided workouts, food logs, runs and progress in one calm fitness app.

## Full description

> Uttar Fitness keeps your plan, workouts, nutrition, and progress in one place.
>
> - Weekly plans that reflow when you move a training day
> - Guided workout player with sets, rest timers, form cues, voice controls and a camera form check
> - Food search and barcode scanning with source labels and macro tracking
> - Run tracking with pace and splits; import past runs from CSV, GPX or TCX files, including Strava exports
> - Streaks, personal records, progress charts, water and health logs
> - Offline workout logging and a one-tap JSON data export
> - Dark, light, and automatic wallpapers
>
> Uttar Fitness is free to use, with no ads, subscriptions, or in-app payments. Uttar AI is included free. Sign in with Google to keep your data across devices.
>
> This version does not include Health Connect, Apple Health, or automatic Strava sync. You can import run files instead. Location is used only while a run is being recorded. Form-check camera frames are sent securely to the AI provider for analysis and are not stored by Uttar Fitness.
>
> Uttar Fitness is a general fitness and wellness tool, not a medical device. It does not diagnose, treat, cure, or prevent any disease or medical condition.
>
> Privacy policy: https://xfit-bpe.pages.dev/privacy

## What's new (first release)

> First Play release: guided workouts, food and run tracking, and local run-file import.

## Data safety answers to expect

Use these as the starting point, then check each answer against the shipped build:

- **Collected:** name, email, profile photo, workout logs, health metrics, food logs, fitness goals, text submitted to the AI workout builder, run files chosen by the user.
- **Sensitive data:** health and fitness data; precise location only while a run is active.
- **Purpose:** app functionality and personalization. Not used for advertising, not sold.
- **Processing:** data is transmitted over HTTPS and stored in Firebase. Run files are parsed on the device before any confirmed rows are saved.
- **Camera:** frames are sent over HTTPS to the AI provider for form feedback and are not retained by Uttar Fitness.
- **Purchases:** none. Uttar Fitness has no in-app payments, subscriptions, or paid tiers; Uttar AI is included free.
- **Deletion:** in-app account deletion plus the privacy policy URL.

## Assets still to produce

- 512×512 launcher icon: `public/icons/icon-512.png` is ready to reuse.
- 1024×500 feature graphic: `store/feature-graphic.png` is ready to upload. It was derived from the supplied barbell-U artwork (`store/feature-graphic-source.png`), cropped to the exact Play ratio and resized.
- 2–8 phone screenshots, ideally 1080×1920, from a clean test account: Home, Workout player, Workouts library, Insights, and the run-import preview. Do not screenshot the maintainer's real account data.
- A short promo video is optional.

## Reviewer test account

Play reviewers need to reach signed-in screens. Add a dedicated test account in
Play Console and give them working credentials:

> Email: `<fill in>`  
> Password: `<fill in>`  
> Notes: Sign in with Google. Sample data is fine. No payment or purchase is required.

Do not use a personal account with real training history.
