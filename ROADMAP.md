# Uttar Fitness Roadmap

_Last updated: 2026-11-27 (closed test live; Google Group tester change approved)._

## Current gate: closed testing

Release `Closed test 1.0` (version code 3) was approved and published on
2026-11-27 at 10:51 AM. The `Closed testing - Alpha` track is Active and this is
its latest release. Play shows it as **Available to selected testers**.

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
settings. The follow-up change switching closed-test testers to the Google Group
is also approved: Publishing overview has no pending changes and the track lists
`uttar-fitness-closed-testers@googlegroups.com` as the tester group. New group
members can access the test now.

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

## Queued fixes and additions — first release after closed testing

Do not add these to the live closed-test build; any native change needs a new
version code, upload, and review. Land these with the first post-test release:

1. **Fix Apply time calculation**
   - Typing a duration such as `0:45` or `:30` and tapping **Apply** must set the
     interval to that exact value.
   - Stop subtracting entered or elapsed seconds from a 60-second or elapsed
     baseline. No leftover offsets.

2. **Voice Count toggle on the Reps screen**
   - Put **Voice Count** directly above the Weight input field.
   - Default to **Off** every time the screen loads; it is explicit opt-in.

3. **Hands-free voice rep counting**
   - When Voice Count is On, listen for spoken numbers and increment **REPS DONE**
     automatically instead of requiring a tap for every rep.
   - Keep speech audio and transcripts on-device; do not upload or store them.
   - Needs debouncing, clear start/stop feedback, and graceful handling of
     denied mic permission, silence, and no-network speech recognition.

4. **Fix workout duration mismatch**
   - Workouts tab cards show a different minute count from the workout detail,
     player, and exercise list.
   - Known example: `Core Crusher` is seeded with `duration: 25`, but its five
     60-second exercises derive to 5 minutes in `WorkoutDetail.jsx` / the player.
   - Decide the source of truth before changing catalog data; do not silently
     rewrite real account data. Cards, detail, player, and logged minutes must all
     agree.

Google Health Connect and the OS-level app-lock version of Activity Unlock remain
later-stage work. Health Connect follows the first post-test release; Focus Mode
starts with manual in-app check-ins, and OS-level locking is evaluated only after
Play policy/permission review.

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

6. **Focus Mode / app locker**
   - Desired end state (user clarification): `Profile → Focus Mode` → turn on,
     choose activity and reps → all other apps on the phone are locked. Opening a
     locked app presents the Uttar gate; completing the chosen activity unlocks it.
     Focus Mode can be turned off again from Profile.
   - First implementation remains the in-app gate: opening Uttar requires a
     completed check-in. Android OS-level app locking is the goal but deferred: it
     needs overlay/usage-access/foreground-service permissions and Play policy
     review. Keep manual check-in fallback and exempt emergency calling.

7. **Health Connect integration**
   - Opt-in only, read-only, on-device first.
   - Show the user's own steps/workouts/sleep trends inside Uttar.
   - No raw health values in Firestore or admin analytics.
   - Update Data Safety declaration before shipping.
   - When Health Connect is live on the Insights/Health page, remove the current
     “Health Connect and Apple Health support is planned but not available yet…
     log your stats manually…” note under **Connect a Fitness Device** and replace
     it with accurate availability copy. Do not claim Apple Health support.

8. **Real community / accountability circles**
   - Only if users ask for it.
   - No fake activity or seeded social proof.

9. **Monetization**
   - Last, after retention is proven.
   - No upfront gate, upgrade screens, quotas, or subscription pressure before value is clear.

## Activity Unlock / Focus Mode — future research notes

Parked for the later OS-level version of Focus Mode. Not in v3 scope. There is
currently no `ios/` platform target in this repo, so iOS work cannot start until
an iOS/Capacitor target exists.

### Desired end state

1. User turns on `Profile → Focus Mode`.
2. User chooses an activity and target, e.g. 20 push-ups.
3. User chooses which distracting apps/categories are locked; Phone, Messages,
   emergency services, and Uttar itself stay reachable.
4. Opening a locked app shows the system/Apple shield or Android gate with
   “Do your activity to unlock.”
5. User completes the chosen activity in Uttar or through the permitted camera
   flow.
6. The app unlocks, optionally for a temporary window before the shield returns.
7. User can turn Focus Mode off again from `Profile`.

### Camera + rep counting

- Camera use is explicit opt-in only, with manual check-in always available.
- Frames are processed on-device; no frames are uploaded or stored.
- No raw camera/health data goes into Firestore, analytics, or admin views. Only
  derived rep counts/unlock events are kept.
- Countable reps: push-ups, squats, sit-ups, jumping jacks, burpees.
- Planks and similar holds use a timer/hold check, not a rep count.
- Burpees need more forgiving state-machine logic than simple joint-angle reps.

### Staging

- **V1:** in-app/manual check-in gate. UI must be honest that other apps are not
  system-locked yet.
- **V2 Android:** OS-level lock after Play policy/permission review; camera
  verification remains opt-in.
- **V2 iOS:** Screen Time APIs and Shield extensions; shield → Uttar → verify →
  unlock. The camera cannot run inside Apple's shield extension.

### iOS implementation path (when an iOS app exists)

1. **Entitlements and targets:** add Family Controls capability to the app and
   Screen Time extensions (`com.apple.developer.family-controls`). Development
   can use the capability; TestFlight/App Store distribution requires Apple's
   entitlement request. Add an App Group/shared container for the saved
   `FamilyActivitySelection`, Focus Mode state, and unlock window.
2. **Authorize and choose apps:** call
   `AuthorizationCenter.shared.requestAuthorization(for: .individual)` and
   present `FamilyActivityPicker`. iOS returns opaque `ApplicationToken` values;
   the app does not learn the specific chosen apps from the picker.
3. **Apply the shield:** put the saved tokens into a named
   `ManagedSettingsStore().shield.applications`. iOS enforces the shield at the
   OS level; up to 50 application tokens can be shielded at once.
4. **ShieldConfiguration extension:** show a static Uttar-branded gate:
   “Focus Mode Active,” “Complete 20 push-ups to unlock,” and a primary button
   like “Start Push-Ups.” This extension is sandboxed: no live camera, no network
   calls, no custom full-screen app UI.
5. **ShieldAction extension:** handle the button tap. On iOS 26.5+, Apple
   documents `ShieldActionResponse.openParentalControlsApp` for returning the
   user to Uttar. On earlier versions there is no documented direct
   parent-app-open API; use a local notification/deep link or tell the user to
   open Uttar. Do not rely on private APIs.
6. **Verify in Uttar:** V1 uses a manual completed check-in. V2 may use on-device
   `VNDetectHumanBodyPoseRequest` or MediaPipe. Only after the target is met,
   clear that named store's shield (or set `shield.applications = nil`). A
   `DeviceActivity` schedule can reapply it after a temporary unlock window.
7. **Token/QA caveats:** treat tokens as re-creatable; handle unknown tokens with
   a generic shield and re-prompt the user to reselect apps. Record a demo video
   for App Review explaining that Screen Time is used only for user-initiated
   fitness/self-control gating.

Uttar guardrails when this is eventually built:

- Camera use must be explicit opt-in with a clear explanation.
- Pose detection and frame processing stay on-device; no video upload and no stored frames.
- Only derived unlock events and rep counts may be stored; no raw health values in Firestore or admin analytics.
- Show honest permission prompts; do not present OS-level locking as a normal in-app feature.
- Include an emergency escape hatch/cooldown so injury or urgency never traps the user.
- Validate Play policy and Accessibility/overlay permissions before Android implementation.
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

The closed-test release and Google Group tester change are both live. Get testers to join the group, opt in, update to version code 3, and keep the app installed for 14 days. If testing passes, do the queued fixes first, then priorities **1 and 2**: Today's Focus plus data-grounded Uttar AI. Health Connect and Activity Unlock come after that.
