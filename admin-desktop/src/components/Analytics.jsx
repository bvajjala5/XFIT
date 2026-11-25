import { useEffect, useState } from 'react'
import {
  Sparkles,
  Dumbbell,
  Users,
  Route,
  UtensilsCrossed,
  ShieldCheck,
  Info,
  AlertTriangle,
  BarChart3,
  Clock,
  Smartphone,
  RefreshCw,
} from 'lucide-react'
import { api } from '../lib/api.js'
import { formatDate, formatDuration } from '../lib/format.js'
import { StatCard, Spinner, Badge } from './ui.jsx'

const NUMBER = new Intl.NumberFormat()

const fmt = {
  integer: (value) => NUMBER.format(Math.round(value)),
  percent: (value) => `${Number(value).toFixed(1)}%`,
  money: (value) => `$${Number(value).toFixed(4)}`,
  tokens: (value) => NUMBER.format(Math.round(value)),
  seconds: (value) => formatDuration(value),
  meters: (value) =>
    value >= 1000 ? `${(value / 1000).toFixed(2)} km` : `${NUMBER.format(Math.round(value))} m`,
  pace: (value) => `${Number(value).toFixed(2)} /km`,
}

const NOT_INSTRUMENTED = (
  <span className="not-instrumented" title="No telemetry has been recorded for this signal yet">
    Not instrumented yet
  </span>
)

function Metric({ label, value, format = fmt.integer, hint, tone = 'accent', icon: Icon }) {
  return (
    <StatCard
      icon={Icon}
      label={label}
      value={value === null || value === undefined ? NOT_INSTRUMENTED : format(value)}
      hint={hint}
      tone={tone}
    />
  )
}

function Note({ children, tone = 'info', icon: Icon = Info }) {
  return (
    <div className={`analytics-note analytics-note-${tone}`}>
      <Icon size={15} />
      <span>{children}</span>
    </div>
  )
}

function Breakdown({ title, subtitle, rows, emptyLabel = 'Not instrumented yet' }) {
  const list = Array.isArray(rows) ? rows : []
  const max = Math.max(1, ...list.map((row) => row.count || 0))
  return (
    <section className="card">
      <div className="card-head">
        <div>
          <h2 className="card-title">{title}</h2>
          {subtitle ? <p className="card-sub">{subtitle}</p> : null}
        </div>
        <BarChart3 size={15} className="card-head-icon" />
      </div>
      {list.length === 0 ? (
        <p className="analytics-empty">{emptyLabel}</p>
      ) : (
        <ul className="breakdown-list">
          {list.map((row, index) => (
            <li key={`${row.label}-${index}`} className="breakdown-row">
              <span className="breakdown-label" title={row.label}>{row.label}</span>
              <span className="breakdown-track">
                <span className="breakdown-fill" style={{ width: `${Math.max(3, ((row.count || 0) / max) * 100)}%` }} />
              </span>
              <span className="breakdown-value">{NUMBER.format(row.count || 0)}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function Section({ title, subtitle, icon: Icon, section, children }) {
  const status = section?.available === false ? 'unavailable' : section?.instrumented ? 'aggregates' : 'empty'
  return (
    <section className="card analytics-section">
      <div className="card-head">
        <div>
          <h2 className="card-title analytics-section-title">
            {Icon ? <Icon size={16} /> : null}
            {title}
          </h2>
          <p className="card-sub">{subtitle}</p>
        </div>
        <Badge tone={status === 'aggregates' ? 'green' : status === 'empty' ? 'amber' : 'red'}>
          {status === 'aggregates' ? 'Aggregates' : status === 'empty' ? 'Not instrumented yet' : 'Unavailable'}
        </Badge>
      </div>
      {section?.available === false ? (
        <Note tone="warning" icon={AlertTriangle}>
          This source could not be read. Check the Firestore collection and indexes, then refresh.
        </Note>
      ) : null}
      <div className="analytics-body">{children}</div>
    </section>
  )
}

function ActiveUsersChart({ series }) {
  const points = Array.isArray(series) ? series : []
  const max = Math.max(1, ...points.map((point) => point.count || 0))
  return (
    <section className="card">
      <div className="card-head">
        <div>
          <h2 className="card-title">Daily active users</h2>
          <p className="card-sub">Distinct users with a telemetry day, last 14 days</p>
        </div>
        <RefreshCw size={15} className="card-head-icon" />
      </div>
      {points.length === 0 ? (
        <p className="analytics-empty">Not instrumented yet</p>
      ) : (
        <div className="chart" role="img" aria-label="Daily active users over the last 14 days">
          {points.map((point) => (
            <div key={point.date} className="chart-col" title={`${point.date}: ${point.count}`}>
              <div className="chart-track">
                <div className="chart-bar" style={{ height: `${Math.max(4, ((point.count || 0) / max) * 100)}%` }} />
              </div>
              <span className="chart-count">{point.count}</span>
              <span className="chart-day">{point.date ? point.date.slice(8, 10) : ''}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

export default function Analytics({ refreshKey, onError }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    setLoading(true)
    api
      .analytics()
      .then((result) => {
        if (alive) setData(result)
      })
      .catch((error) => onError(error.message))
      .finally(() => {
        if (alive) setLoading(false)
      })
    return () => {
      alive = false
    }
  }, [refreshKey, onError])

  if (loading && !data) {
    return (
      <div className="panel-loading">
        <Spinner label="Loading analytics" /> <span>Loading analytics…</span>
      </div>
    )
  }
  if (!data) return null

  const s = data.sections || {}
  const ai = s.uttarAi || {}
  const engagement = s.engagement || {}
  const retention = s.retention || {}
  const runs = s.runsImports || {}
  const nutrition = s.nutritionHealth || {}
  const reliability = s.reliability || {}

  return (
    <div className="stack analytics-view">
      <Note tone={data.sample ? 'warning' : 'info'} icon={data.sample ? AlertTriangle : ShieldCheck}>
        {data.sample
          ? 'Sample-only analytics — every figure below is synthetic aggregate data for preview, not real user data.'
          : 'Privacy-safe aggregates only. No document IDs, UIDs, raw health values, food names, prompts, or message content are read into this view.'}
      </Note>

      <Section
        title="Uttar AI"
        subtitle="Requests, outcomes, usage mix, and estimated cost"
        icon={Sparkles}
        section={ai}
      >
        <div className="stat-grid">
          <Metric label="Requests" value={ai.requests} icon={Sparkles} />
          <Metric label="Success rate" value={ai.successRate} format={fmt.percent} tone="green" icon={Sparkles} />
          <Metric label="Successes" value={ai.successes} tone="green" />
          <Metric label="Failures" value={ai.failures} tone="red" />
          <Metric label="Rate limits" value={ai.rateLimits} tone="amber" />
          <Metric label="Est. tokens" value={ai.estimatedTokens} format={fmt.tokens} tone="cyan" icon={BarChart3} />
          <Metric
            label="Est. cost"
            value={ai.estimatedCostUsd}
            format={fmt.money}
            tone="cyan"
            hint={`${ai.tokenRatePerMillion ?? '—'} USD / 1M tokens`}
          />
        </div>
        <div className="two-col analytics-split">
          <Breakdown
            title="Estimated tokens by mode"
            subtitle="chat 1,200 · workout/plan 2,000 · formcheck 320 tokens per request"
            rows={Object.entries(ai.modeTokens || {}).map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count)}
          />
          <div className="card">
            <div className="card-head">
              <div>
                <h2 className="card-title">Cost estimate</h2>
                <p className="card-sub">How to read these numbers</p>
              </div>
              <Info size={15} className="card-head-icon" />
            </div>
            <div className="analytics-notes">
              <Note tone="info">
                Token and cost figures are an <strong>estimate only</strong>, based on mode buckets and the configurable
                <code> ADMIN_ANALYTICS_TOKEN_COST_PER_MILLION</code> rate. They are not an invoice.
              </Note>
            </div>
          </div>
        </div>
      </Section>

      <Section
        title="Engagement"
        subtitle="Workouts, completion, custom plans, and personal records"
        icon={Dumbbell}
        section={engagement}
      >
        <div className="stat-grid">
          <Metric label="Started" value={engagement.workoutsStarted} icon={Dumbbell} />
          <Metric label="Completed" value={engagement.workoutsCompleted} tone="green" />
          <Metric label="Completion rate" value={engagement.completionRate} format={fmt.percent} tone="green" />
          <Metric label="Drop-offs" value={engagement.dropOffs} tone="amber" />
          <Metric label="Avg duration" value={engagement.avgWorkoutDurationSeconds} format={fmt.seconds} tone="cyan" icon={Clock} />
          <Metric label="Workout docs" value={engagement.workoutDocuments} hint="Aggregate count" />
          <Metric label="Custom created" value={engagement.customCreated} />
          <Metric label="Custom shared" value={engagement.customShared} />
          <Metric label="Custom imported" value={engagement.customImported} />
          <Metric label="PRs logged" value={engagement.prsLogged} tone="green" />
        </div>
        <div className="two-col analytics-split">
          <Breakdown title="Most-used workouts" subtitle="Workout titles only, no user linkage" rows={engagement.topWorkouts} />
          <Breakdown title="Drop-off reasons" subtitle="Coarse telemetry buckets" rows={engagement.dropOffReasons} />
        </div>
      </Section>

      <Section
        title="Retention"
        subtitle="Active users, sign-ups, return rate, and active-day streaks"
        icon={Users}
        section={retention}
      >
        <div className="stat-grid">
          <Metric label="DAU" value={retention.dau} hint="Active today" tone="green" icon={Users} />
          <Metric label="WAU" value={retention.wau} hint="Last 7 days" tone="green" />
          <Metric label="MAU" value={retention.mau} hint="Last 30 days" tone="green" />
          <Metric label="Sign-ups" value={retention.signups} hint="Auth metadata" tone="purple" />
          <Metric label="New · 7 days" value={retention.signups7d} tone="purple" />
          <Metric label="Returning users" value={retention.returningUsers} hint="Active on 2+ days" tone="cyan" />
          <Metric label="Zero activity" value={retention.zeroActivityUsers} hint="No telemetry days" tone="amber" />
          <Metric label="Zero 7d after signup" value={retention.zeroActivityAfterSignup7d} tone="amber" />
        </div>
        <div className="two-col analytics-split">
          <ActiveUsersChart series={retention.activeUsersSeries} />
          <Breakdown title="Active-day streak buckets" subtitle="Number of distinct active days per user" rows={retention.streakBuckets} />
        </div>
      </Section>

      <Section
        title="Runs & imports"
        subtitle="GPS runs, file imports, and duplicate blocks"
        icon={Route}
        section={runs}
      >
        <div className="stat-grid">
          <Metric label="GPS runs" value={runs.runsCount} hint="Run documents" icon={Route} />
          <Metric label="Runs started" value={runs.runsStarted} />
          <Metric label="Runs completed" value={runs.runsCompleted} tone="green" />
          <Metric label="Avg distance" value={runs.avgDistanceMeters} format={fmt.meters} tone="cyan" />
          <Metric label="Avg duration" value={runs.avgDurationSeconds} format={fmt.seconds} tone="cyan" icon={Clock} />
          <Metric label="Avg pace" value={runs.avgPaceMinPerKm} format={fmt.pace} tone="cyan" />
          <Metric label="Imports saved" value={runs.importsSaved} tone="green" />
          <Metric label="Imports failed" value={runs.importsFailed} tone="red" />
          <Metric label="Duplicates blocked" value={runs.importsDuplicate} tone="amber" />
        </div>
        <Breakdown
          title="Import sources"
          subtitle="csv · gpx · tcx · strava (telemetry buckets)"
          rows={runs.importSources}
        />
      </Section>

      <Section
        title="Nutrition & health"
        subtitle="Count-only food logging and health permission signals"
        icon={UtensilsCrossed}
        section={nutrition}
      >
        <Note tone="warning" icon={ShieldCheck}>
          {nutrition.healthBanner || 'Health data is shown only as counts. Raw health values are never displayed here.'}
        </Note>
        <div className="stat-grid">
          <Metric label="Food logs" value={nutrition.foodLogs} icon={UtensilsCrossed} />
          <Metric label="Logs / active day" value={nutrition.foodLogsPerActiveDay} format={(v) => Number(v).toFixed(1)} tone="cyan" />
          <Metric label="Food log docs" value={nutrition.foodLogDocuments} hint="Count only" />
          <Metric label="Corrections saved" value={nutrition.correctionsSaved} />
          <Metric label="Corrections reset" value={nutrition.correctionsReset} />
          <Metric label="Health prompted" value={nutrition.healthPrompted} tone="purple" />
          <Metric label="Health granted" value={nutrition.healthGranted} tone="green" />
          <Metric label="Health denied" value={nutrition.healthDenied} tone="red" />
          <Metric label="Health log docs" value={nutrition.healthLogDocuments} hint="Count only" icon={ShieldCheck} />
        </div>
        <Breakdown title="Food log sources" subtitle="Telemetry buckets, no food names" rows={nutrition.foodSources} />
      </Section>

      <Section
        title="Reliability, cost & safety"
        subtitle="Writes, exports, privacy requests, AI errors, and environment mix"
        icon={ShieldCheck}
        section={reliability}
      >
        <div className="stat-grid">
          <Metric label="Offline queued writes" value={reliability.offlineQueuedWrites} icon={RefreshCw} />
          <Metric label="Write failures" value={reliability.writeFailures} tone="red" />
          <Metric label="AI provider error rate" value={reliability.aiProviderErrorRate} format={fmt.percent} tone="red" />
          <Metric label="Export requested" value={reliability.exportRequested} />
          <Metric label="Export succeeded" value={reliability.exportSucceeded} tone="green" />
          <Metric label="Export failed" value={reliability.exportFailed} tone="red" />
          <Metric label="Deletion requests" value={reliability.deletionRequests} tone="amber" />
          <Metric label="Support contacts" value={reliability.supportContacts} />
          <Metric label="Community reports" value={reliability.communityReports} tone="amber" />
          <Metric label="PWA installed" value={reliability.pwaInstalled} tone="green" icon={Smartphone} />
          <Metric label="Install prompts" value={reliability.pwaInstallPrompted} icon={Smartphone} />
          <Metric label="Install accepted" value={reliability.pwaInstallAccepted} tone="green" />
        </div>
        <div className="two-col analytics-split">
          <div className="analytics-column">
            <Breakdown title="Platforms" subtitle={reliability.environmentSource} rows={reliability.platforms} />
            <Breakdown title="Browsers" rows={reliability.browsers} />
          </div>
          <div className="analytics-column">
            <Breakdown title="Operating systems" rows={reliability.os} />
            <Breakdown title="App versions" rows={reliability.appVersions} />
          </div>
        </div>
        <div className="two-col analytics-split">
          <Breakdown title="Write failures by collection" rows={reliability.writeFailureCollections} />
          <Breakdown title="Support destinations" rows={reliability.supportDestinations} />
          <Breakdown title="Community report reasons" rows={reliability.reportReasons} />
        </div>
      </Section>

      <div className="analytics-footer">
        <span>
          Generated {data.generatedAt ? formatDate(data.generatedAt) : '—'} ·{' '}
          {data.generatedAt ? new Date(data.generatedAt).toLocaleTimeString() : ''}
        </span>
        <span>
          Scanned: analyticsDays {fmt.integer(data.scanned?.analyticsDays ?? 0)} · workouts{' '}
          {fmt.integer(data.scanned?.workouts ?? 0)} · runs {fmt.integer(data.scanned?.runs ?? 0)} · entries{' '}
          {fmt.integer(data.scanned?.entries ?? 0)} · auth users {fmt.integer(data.scanned?.authUsers ?? 0)}
        </span>
        <span>Read limit: {fmt.integer(data.limits?.docsPerCollection ?? 20000)} docs per collection</span>
        {data.warnings?.length ? (
          <span className="analytics-warning">
            {data.warnings.length} source{data.warnings.length === 1 ? '' : 's'} unavailable — shown as “Not instrumented yet”.
          </span>
        ) : null}
      </div>
    </div>
  )
}
