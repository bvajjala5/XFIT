# Uttar Fitness Roadmap

_Last updated: 2026-11-26. Parked ideas only — no app code changes._

## Current gate: v2 internal testing

v2 is live on the internal testing track as **Fixed Google sign-in 1.0**.

- Status: active, available to internal testers, **not reviewed**
- No production submission or review request has been made
- Tester link: `https://play.google.com/apps/internaltest/4701718686319161474`

Do not start v3 feature work until v2 passes:

- Testers update from Play and sign in with Google
- Workout, food, run import, AI, and Profile → Advanced data tools work
- No blocking crashes or ANRs

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
- No Play review, closed testing rollout, or production rollout without explicit approval

## Next action

Wait for tester feedback. If v2 passes, start with priorities **1 and 2**: Today's Focus plus data-grounded Uttar AI.
