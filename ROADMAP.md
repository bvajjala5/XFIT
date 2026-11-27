# Uttar Fitness Roadmap

_Last updated: 2026-11-27 (closed test live; Google Group tester change in review)._

## Current gate: closed testing

Release `Closed test 1.0` (version code 3) was approved and published on
2026-11-27. The `Closed testing - Alpha` track is Active and this is its latest
release.

- Closed-test web opt-in link: `https://play.google.com/apps/testing/com.uttar.fitness`
- Closed-test Android opt-in link: `https://play.google.com/store/apps/details?id=com.uttar.fitness`
- Google Group join link: `https://groups.google.com/g/uttar-fitness-closed-testers`
- Google Group email: `uttar-fitness-closed-testers@googlegroups.com`
- Feedback email: `bhanu.charan.vajjala@gmail.com`
- Countries/regions: India and United States
- AAB SHA-256: `3f6b35046ab44f260f7cecfcfebe281b03fc19f47dcb4af176e02da69db75f1e`
- No full rollout or production release has been started.

The initial review submission covered 14 changes, including the closed-test
release, store listing, app content, data safety, privacy policy, and store
settings. A follow-up change switching closed-test testers from the internal email
list to the Google Group was submitted with explicit approval and is **in review**.
New group members can access the test once that change is approved.

v2 remains live on internal testing as **Fixed Google sign-in 1.0** (version code 2).
The version code was bumped to 3 for closed testing because Play rejects a reused
version code.

Do not start v3 feature work until closed testing passes:

- Closed-test release and Google Group tester change are both live
- Testers join the group, opt in, sign in with Google, and can use the app
- Workout, food, run import, AI, and Profile → Advanced data tools work
- No blocking crashes or ANRs

## Open QA item: Pixel 10a tester report

An internal tester using the Play internal link reported:

- “Doesn’t let you log in”
- “Blocks out everything on the top left and right corners”

Status: **lower risk / still awaiting screenshot**.

- Play Console confirms v2 is Active / Latest release / version code 2; v1 is Inactive.
- Local emulator sign-in passed with the final APK.
- A second internal tester initially could not sign in, then succeeded after retrying / following the checklist. They were able to sign in and use the app.
- BrowserStack sign-in failure was explained by no Google credential on the remote device; its corner overlays are BrowserStack UI, not the app.
- If the Pixel tester was on v1, updating should resolve it.
- If on v2 with a Google account signed in and still failing, screenshot + device details are needed before any code change.

Do not rebuild or publish in response to this report until it is confirmed.

## Reddit demo feedback — 2026-11-27

Feedback from a Reddit reader after viewing the public demo:

1. **Mobile `/demo` order:** the app frame started far below the explainer text on phones.
   - Fixed: app frame / feature preview now comes first on small screens; explainer moves below it. Desktop order is unchanged.
2. **AI preview mismatch:** copy said “plain language,” but only preset questions were available and the composer looked typeable.
   - Fixed: intro and sidebar say you can type your own question in the signed-in app; the demo composer now reads “Type your own questions in the full app.”
3. **Share preview:** `og:image` was the small square app icon.
   - Fixed: added `public/og-image.png` (1200×630 product screenshot) and updated Open Graph / Twitter card meta tags.

These were public-web-only changes. The later version 3 native build for closed
testing was made separately.

## Protected with Play review — 2026-11-27

Current Play Console status is **Good protection**.

- Automatic protection: **1/1 active**. Kept on; it requires `minSdkVersion >= 24`,
  which the app already has.
- Play Store protection: **6/7 active**. The one off setting is “Prevent installs on
  risky devices / Store listing device checks.” Leave it off during closed testing
  so rooted devices, emulators, and unusual test devices are not blocked. Revisit
  before production.
- Play Integrity API: **0/7 active / not integrated**. Defer. It needs native
  integration, a Cloud project, server-side token verification, and another release.
  There is no payment or high-risk server flow that needs it right now.
- Play Billing protection: **0/4 active**. Not applicable; the app has no purchases,
  subscriptions, or paid AI quota.
- Automatic-protection monitoring shows no data because there are no production
  installs yet. That is expected.

Revisit this page before production, not during closed testing.

## Competitive lens: Critique AI

Why people like it:

- All-in-one daily plan, physique check-ins, food scanning, mindset challenges
- Fast routine generation and automated tracking

Why people criticize it:

- Hard paywall, aggressive subscription screens, difficult cancellation
- Generic or repetitive AI that ignores real context
- Superficial features and fake-feeling community
- Cannot see real movement, form, or hidden injuries

Uttar's wedge:

- Free tier; Uttar AI free for now
- Public `/demo` before sign-in; no forced paywall
- Stable native Google sign-in
- Clean, calm UI with static cosmic/alabaster themes
- Form Check, demo/body-map visibility, tempo cues
- Grounded in the user's own logged data

## Parked v3 priorities

Ranked by impact, effort, and risk.

1. **Today's Focus dashboard**
   - One home card combining suggested workout, macro target, one small habit, and one AI tip.
   - Removes “what should I do today?” friction without cluttering the UI.

2. **Data-grounded Uttar AI**
   - Reference actual logged sets, reps, calories, streaks, and recent runs.
   - Example: “Last session you hit 15 reps at 25 lb — try 2×12 with a slower tempo today.”
   - Directly counters the generic/repetitive AI complaint.

3. **Private progress check-ins**
   - Progress photos, body measurements, strength trends.
   - No public ratings and no fake social proof.

4. **Consistency challenges**
   - 7-day / 30-day streaks based on real actions: 3 workouts/week, protein target, run logged.
   - Reward effort, not vanity metrics.

5. **Faster logging**
   - Barcode scanner and quick photo food logging if not already solid.
   - Keep quick-add actions clean and secondary tools tucked away.

6. **Focus Mode — in-app gate first**
   - Configure under `Profile → Focus Mode`: activity (push-ups, squats, plank), reps/timer, session length.
   - Opening Uttar shows a gate; complete the quick check-in before entering.
   - OS-level locking of other apps is deferred: it needs powerful permissions and carries Play policy/review risk.

7. **Health Connect integration**
   - Opt-in only, read-only, on-device first.
   - Show the user's own steps/workouts/sleep trends inside Uttar.
   - No raw health values in Firestore or admin analytics.
   - Update Data Safety declaration before shipping.

8. **Real community / accountability circles**
   - Only if users ask for it.
   - No fake activity or seeded social proof.

9. **Monetization**
   - Last, after retention is proven.
   - No upfront gate, upgrade screens, quotas, or subscription pressure before value is clear.

## Activity Unlock — future research notes

Parked for the later OS-level version of Focus Mode. Not in v3 scope.

How similar screen-time fitness blockers work:

- **App selection:** user chooses distracting apps such as social media, games, or streaming services.
- **Enforcement:**
  - iOS: integrate with Apple's Screen Time API / device-management family APIs to limit or block selected apps.
  - Android: foreground service plus `TYPE_APPLICATION_OVERLAY` to detect the blocked app and show a lock screen over it.
- **Strict mode / bypass prevention:** removing a restriction may require a cool-down timer, a heavier penalty set, or approval from a trusted friend.
- **Activity-based unlock:** when the user wants more access, the gate opens the camera and verifies a countable movement.
- **Pose detection:** on-device skeletal tracking of head, shoulders, elbows, wrists, hips, and knees validates full-range reps in real time.
- **Reps-to-time conversion:** each verified rep grants a configurable amount of screen time, e.g. 1 push-up = 1 minute.
- **Supported activities for Uttar:** any activity the counter can reliably verify — push-ups, squats, planks, and similar bodyweight movements — configurable by the user.

Uttar guardrails when this is eventually built:

- Camera use must be explicit opt-in with a clear explanation.
- Pose detection and frame processing stay on-device; no video upload and no stored frames.
- Only derived unlock events and rep counts may be stored; no raw health values in Firestore or admin analytics.
- Show honest permission prompts; do not present OS-level locking as a normal in-app feature.
- Validate Play policy and Accessibility/overlay permissions before implementation.
- Keep a simple manual check-in fallback for users who do not want camera access.

## Explicit non-goals for now

- No paywall, subscription, quota, or upgrade UI/endpoints for Uttar AI
- No silent health reads; explicit permission required
- No raw health values in analytics/admin views
- No OS-level app locking in v3
- No camera-based rep verification in v3; Focus Mode starts with manual check-ins
- No fake community activity
- No Firestore rules changes or deploy without explicit approval
- No additional Play review, closed testing rollout, or production rollout without explicit approval

## Next action

Wait for the closed-test release to be approved and for tester feedback. If it passes, start with priorities **1 and 2**: Today's Focus plus data-grounded Uttar AI.
