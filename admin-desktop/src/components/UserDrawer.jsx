import { useEffect, useState } from 'react'
import {
  X,
  ShieldCheck,
  ShieldOff,
  Ban,
  RotateCcw,
  Mail,
  Fingerprint,
  CalendarClock,
  Activity,
  Dumbbell,
  LogIn,
} from 'lucide-react'
import { api } from '../lib/api.js'
import { formatDate, formatDateTime, timeAgo, goalLabel, formatDuration } from '../lib/format.js'
import { Avatar, Badge, Spinner, ConfirmDialog, useToast } from './ui.jsx'

const COUNT_LABELS = {
  workouts: 'Workouts',
  customWorkouts: 'Custom plans',
  healthLogs: 'Health logs',
  runs: 'Runs',
  weightLogs: 'Weight logs',
  checkins: 'Check-ins',
  followers: 'Followers',
  customFoods: 'Custom foods',
}

export default function UserDrawer({ uid, onClose, onChanged, onError }) {
  const toast = useToast()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [roleDraft, setRoleDraft] = useState('user')
  const [busy, setBusy] = useState(false)
  const [confirm, setConfirm] = useState(null)

  useEffect(() => {
    let alive = true
    setLoading(true)
    setData(null)
    api
      .getUser(uid)
      .then((result) => {
        if (!alive) return
        setData(result)
        setRoleDraft(result.role)
      })
      .catch((error) => onError(error.message))
      .finally(() => {
        if (alive) setLoading(false)
      })
    return () => {
      alive = false
    }
  }, [uid, onError])

  useEffect(() => {
    const onKey = (event) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const saveRole = async () => {
    if (!data || roleDraft === data.role) return
    setBusy(true)
    try {
      await api.setRole(uid, roleDraft)
      setData((prev) => ({ ...prev, role: roleDraft }))
      toast({ tone: 'success', title: 'Role updated', message: `${data.email || uid} is now ${roleDraft}.` })
      onChanged()
    } catch (error) {
      toast({ tone: 'danger', title: 'Could not change role', message: error.message })
    } finally {
      setBusy(false)
    }
  }

  const toggleSuspended = async () => {
    if (!data) return
    const next = !data.disabled
    setBusy(true)
    try {
      await api.setSuspended(uid, next)
      setData((prev) => ({ ...prev, disabled: next }))
      toast({
        tone: next ? 'warning' : 'success',
        title: next ? 'Account suspended' : 'Account restored',
        message: `${data.email || uid} ${next ? 'can no longer sign in' : 'can sign in again'}.`,
      })
      onChanged()
    } catch (error) {
      toast({ tone: 'danger', title: 'Could not update account', message: error.message })
    } finally {
      setBusy(false)
      setConfirm(null)
    }
  }

  return (
    <div className="drawer-backdrop" onClick={onClose} role="presentation">
      <aside
        className="drawer"
        role="dialog"
        aria-modal="true"
        aria-label="User details"
        onClick={(event) => event.stopPropagation()}
      >
        <button type="button" className="drawer-close" onClick={onClose} aria-label="Close details">
          <X size={18} />
        </button>

        {loading || !data ? (
          <div className="panel-loading drawer-loading">
            <Spinner label="Loading user" /> <span>Loading user…</span>
          </div>
        ) : (
          <>
            <header className="drawer-head">
              <Avatar name={data.fullName} email={data.email} src={data.profilePicture} size={56} />
              <div className="drawer-head-text">
                <h2 className="drawer-name">{data.fullName || data.displayName || 'Unnamed user'}</h2>
                <p className="drawer-email">{data.email || 'No email'}</p>
                <div className="drawer-badges">
                  <Badge tone={data.role === 'admin' ? 'purple' : 'neutral'}>{data.role === 'admin' ? 'Admin' : 'User'}</Badge>
                  <Badge tone={data.disabled ? 'red' : 'green'}>{data.disabled ? 'Suspended' : 'Active'}</Badge>
                  {data.emailVerified ? <Badge tone="cyan">Verified</Badge> : <Badge tone="amber">Unverified</Badge>}
                </div>
              </div>
            </header>

            <section className="drawer-section">
              <h3 className="drawer-section-title">Access &amp; security</h3>
              <div className="field-row">
                <label className="field">
                  <span className="field-label">Role</span>
                  <select value={roleDraft} onChange={(event) => setRoleDraft(event.target.value)} disabled={busy}>
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </label>
                <button
                  type="button"
                  className="btn btn-primary field-action"
                  onClick={saveRole}
                  disabled={busy || roleDraft === data.role}
                >
                  {data.role === 'admin' ? <ShieldCheck size={15} /> : <ShieldOff size={15} />}
                  Save role
                </button>
              </div>
              <p className="field-hint">
                Admin is a Firebase Auth custom claim (<code>admin: true</code>) — the same check the app&apos;s
                <code> firestore.rules</code> uses.
              </p>

              <button
                type="button"
                className={`btn ${data.disabled ? 'btn-success' : 'btn-danger'} btn-block`}
                onClick={() =>
                  setConfirm(
                    data.disabled
                      ? { title: 'Restore account', message: `Allow ${data.email || uid} to sign in again?`, label: 'Restore access', tone: 'success' }
                      : { title: 'Suspend account', message: `Disable sign-in for ${data.email || uid}? Their data is kept and they can be restored later.`, label: 'Suspend account', tone: 'danger' },
                  )
                }
                disabled={busy}
              >
                {data.disabled ? <RotateCcw size={15} /> : <Ban size={15} />}
                {data.disabled ? 'Restore access' : 'Suspend account'}
              </button>
            </section>

            <section className="drawer-section">
              <h3 className="drawer-section-title">Identity</h3>
              <dl className="detail-list">
                <div><dt><Fingerprint size={14} /> UID</dt><dd className="mono">{data.uid}</dd></div>
                <div><dt><Mail size={14} /> Provider</dt><dd>{data.provider}</dd></div>
                <div><dt><CalendarClock size={14} /> Joined</dt><dd>{formatDateTime(data.createdAt)}</dd></div>
                <div><dt><LogIn size={14} /> Last sign-in</dt><dd>{data.lastSignInAt ? `${formatDateTime(data.lastSignInAt)} · ${timeAgo(data.lastSignInAt)}` : 'Never'}</dd></div>
                {data.phoneNumber ? <div><dt>Phone</dt><dd>{data.phoneNumber}</dd></div> : null}
              </dl>
            </section>

            <section className="drawer-section">
              <h3 className="drawer-section-title">Profile</h3>
              <dl className="detail-list">
                <div><dt>Fitness goal</dt><dd>{goalLabel(data.fitnessGoal)}</dd></div>
                <div><dt>Experience</dt><dd>{data.experienceLevel ? data.experienceLevel[0].toUpperCase() + data.experienceLevel.slice(1) : 'Not set'}</dd></div>
                <div><dt>Distance unit</dt><dd>{data.distanceUnit || 'Not set'}</dd></div>
                <div><dt>Onboarding</dt><dd>{data.onboardingComplete ? 'Complete' : 'Incomplete'}</dd></div>
                <div><dt>Profile doc</dt><dd>{data.hasProfile ? 'Present' : 'Missing'}</dd></div>
              </dl>
            </section>

            <section className="drawer-section">
              <h3 className="drawer-section-title">
                <Activity size={14} /> Activity
              </h3>
              <div className="count-grid">
                {Object.entries(COUNT_LABELS).map(([key, label]) => (
                  <div key={key} className="count-cell">
                    <span className="count-value">{data.counts?.[key] ?? '—'}</span>
                    <span className="count-label">{label}</span>
                  </div>
                ))}
              </div>
            </section>

            <section className="drawer-section">
              <h3 className="drawer-section-title">
                <Dumbbell size={14} /> Recent workouts
              </h3>
              {data.recentWorkouts?.length ? (
                <ul className="workout-list">
                  {data.recentWorkouts.map((workout) => (
                    <li key={workout.id}>
                      <div>
                        <p className="workout-name">{workout.name || workout.title || 'Workout'}</p>
                        <p className="workout-meta">{formatDate(workout.completedAt)}</p>
                      </div>
                      <div className="workout-stats">
                        <span>{formatDuration(workout.duration_seconds)}</span>
                        <span>{workout.calories_burned || 0} cal</span>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="muted-text">No workouts logged.</p>
              )}
            </section>
          </>
        )}
      </aside>

      <ConfirmDialog
        open={Boolean(confirm)}
        title={confirm?.title}
        message={confirm?.message}
        confirmLabel={confirm?.label}
        tone={confirm?.tone}
        busy={busy}
        onConfirm={toggleSuspended}
        onCancel={() => setConfirm(null)}
      />
    </div>
  )
}
