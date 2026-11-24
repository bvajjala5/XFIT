import { LayoutDashboard, Users, BarChart3 } from 'lucide-react'
import emblemBlack from '../assets/emblem-black.png'

const NAV = [
  { key: 'overview', label: 'Overview', icon: LayoutDashboard },
  { key: 'users', label: 'Users', icon: Users },
  { key: 'analytics', label: 'Analytics', icon: BarChart3 },
]

export default function Sidebar({ view, onView, projectId, configured }) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <span className="brand-mark">
          <img className="brand-emblem" src={emblemBlack} alt="" />
        </span>
        <div>
          <p className="brand-title">Uttar Fitness</p>
          <p className="brand-subtitle">Admin Control Hub</p>
        </div>
      </div>

      <nav className="nav" aria-label="Primary">
        {NAV.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            className={`nav-item ${view === key ? 'is-active' : ''}`}
            aria-current={view === key ? 'page' : undefined}
            onClick={() => onView(key)}
          >
            <Icon size={17} />
            <span>{label}</span>
          </button>
        ))}
      </nav>

      <div className="sidebar-foot">
        <p className="sidebar-foot-label">Firebase project</p>
        <p className="sidebar-foot-value">{projectId || 'Not set'}</p>
        <span className={`pill ${configured ? 'pill-ok' : 'pill-warn'}`}>
          {configured ? 'Connected' : 'Needs credentials'}
        </span>
      </div>
    </aside>
  )
}
