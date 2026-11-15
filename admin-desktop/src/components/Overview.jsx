import { useEffect, useState } from 'react'
import { Users, UserCheck, ShieldCheck, Ban, UserPlus, Clock, LogIn, RefreshCw, Activity } from 'lucide-react'
import { api } from '../lib/api.js'
import { timeAgo } from '../lib/format.js'
import { StatCard, Spinner, EmptyState, Avatar } from './ui.jsx'

export default function Overview({ refreshKey, onSelectUser, onError }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    setLoading(true)
    api
      .overview()
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
        <Spinner label="Loading overview" /> <span>Loading overview…</span>
      </div>
    )
  }

  if (!data) return null

  const { stats, series, activity } = data
  const max = Math.max(1, ...series.map((point) => point.count))

  return (
    <div className="stack">
      <div className="stat-grid">
        <StatCard icon={Users} label="Total users" value={stats.total} hint={`${stats.onboarded} onboarded`} tone="accent" />
        <StatCard icon={UserCheck} label="Active" value={stats.active} hint="Not suspended" tone="green" />
        <StatCard icon={ShieldCheck} label="Admins" value={stats.admins} hint="Custom claim" tone="purple" />
        <StatCard icon={Ban} label="Suspended" value={stats.suspended} hint="Sign-in disabled" tone="red" />
        <StatCard icon={UserPlus} label="New · 7 days" value={stats.new7d} hint={`${stats.new24h} in last 24h`} tone="cyan" />
        <StatCard icon={Activity} label="Sign-ups today" value={series[series.length - 1]?.count ?? 0} hint="Since midnight" tone="amber" />
      </div>

      <div className="two-col">
        <section className="card">
          <div className="card-head">
            <div>
              <h2 className="card-title">New users</h2>
              <p className="card-sub">Sign-ups per day, last 14 days</p>
            </div>
            <RefreshCw size={15} className="card-head-icon" />
          </div>
          <div className="chart" role="img" aria-label="New sign-ups per day over the last 14 days">
            {series.map((point) => (
              <div key={point.date} className="chart-col" title={`${point.date}: ${point.count}`}>
                <div className="chart-track">
                  <div className="chart-bar" style={{ height: `${Math.max(4, (point.count / max) * 100)}%` }} />
                </div>
                <span className="chart-count">{point.count}</span>
                <span className="chart-day">{point.date.slice(8)}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="card">
          <div className="card-head">
            <div>
              <h2 className="card-title">Recent activity</h2>
              <p className="card-sub">Latest sign-ups and sign-ins</p>
            </div>
            <Clock size={15} className="card-head-icon" />
          </div>
          {activity.length === 0 ? (
            <EmptyState icon={Clock} title="No activity yet" />
          ) : (
            <ul className="activity">
              {activity.slice(0, 12).map((item, index) => (
                <li key={`${item.uid}-${item.type}-${index}`}>
                  <button type="button" className="activity-row" onClick={() => onSelectUser(item.uid)}>
                    <Avatar name={item.name} email={item.email} size={30} />
                    <span className="activity-text">
                      <span className="activity-name">{item.name || item.email || item.uid}</span>
                      <span className="activity-meta">
                        {item.type === 'signup' ? 'Signed up' : 'Signed in'} · {timeAgo(item.at)}
                      </span>
                    </span>
                    <span className={`activity-icon activity-${item.type}`}>
                      {item.type === 'signup' ? <UserPlus size={14} /> : <LogIn size={14} />}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}
