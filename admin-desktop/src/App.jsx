import { useCallback, useEffect, useState } from 'react'
import { RefreshCw, Wifi, FlaskConical, AlertTriangle, Terminal } from 'lucide-react'
import { api, isMock } from './lib/api.js'
import { useToast, Spinner } from './components/ui.jsx'
import Sidebar from './components/Sidebar.jsx'
import Overview from './components/Overview.jsx'
import Users from './components/Users.jsx'
import UserDrawer from './components/UserDrawer.jsx'

const TITLES = {
  overview: { title: 'Overview', subtitle: 'Users and recent activity at a glance' },
  users: { title: 'Users', subtitle: 'Search, inspect, and manage every account' },
}

export default function App() {
  const toast = useToast()
  const [view, setView] = useState('overview')
  const [config, setConfig] = useState(null)
  const [configError, setConfigError] = useState('')
  const [selectedUid, setSelectedUid] = useState(null)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    let alive = true
    api
      .config()
      .then((result) => {
        if (alive) setConfig(result)
      })
      .catch((error) => {
        if (alive) setConfigError(error.message)
      })
    return () => {
      alive = false
    }
  }, [])

  const handleError = useCallback(
    (message) => {
      toast({ tone: 'danger', title: 'Something went wrong', message })
    },
    [toast],
  )

  const refresh = () => setRefreshKey((value) => value + 1)
  const onChanged = () => setRefreshKey((value) => value + 1)

  if (!config && !configError) {
    return (
      <div className="splash">
        <Spinner label="Starting" />
        <p>Starting the Admin Control Hub…</p>
      </div>
    )
  }

  if (configError || config?.configured === false) {
    return (
      <div className="splash">
        <div className="setup-card">
          <span className="setup-icon">
            <AlertTriangle size={22} />
          </span>
          <h1>Connect Firebase</h1>
          <p>
            The Admin Control Hub needs a Firebase <strong>service account</strong> to read users and change
            roles. Add it to the app&apos;s <code>.env</code> file, then restart.
          </p>
          <ol className="setup-steps">
            <li>Firebase console → ⚙️ Project settings → <strong>Service accounts</strong></li>
            <li>Click <strong>Generate new private key</strong> and open the downloaded JSON</li>
            <li>
              Paste <code>client_email</code> and <code>private_key</code> into{' '}
              <code>{config?.envPath || 'admin-desktop/.env'}</code>
            </li>
            <li>Restart with <code>npm start</code></li>
          </ol>
          {configError ? <p className="setup-error">{configError}</p> : null}
        </div>
      </div>
    )
  }

  const meta = TITLES[view]

  return (
    <div className="app">
      <Sidebar view={view} onView={setView} projectId={config?.projectId} configured={config?.configured} />

      <main className="main">
        <header className="topbar">
          <div>
            <h1 className="topbar-title">{meta.title}</h1>
            <p className="topbar-subtitle">{meta.subtitle}</p>
          </div>
          <div className="topbar-actions">
            <span className={`source-badge ${isMock ? 'source-mock' : 'source-live'}`}>
              {isMock ? <FlaskConical size={14} /> : <Wifi size={14} />}
              {isMock ? 'Sample data' : 'Live'}
            </span>
            <button type="button" className="btn btn-ghost" onClick={refresh}>
              <RefreshCw size={15} /> Refresh
            </button>
          </div>
        </header>

        {isMock ? (
          <div className="banner banner-info">
            <Terminal size={15} />
            <span>
              Running in a browser with sample data. Launch the desktop app (<code>npm start</code>) to use your
              live Firebase project.
            </span>
          </div>
        ) : null}

        <div className="content">
          {view === 'overview' ? (
            <Overview refreshKey={refreshKey} onSelectUser={setSelectedUid} onError={handleError} />
          ) : (
            <Users refreshKey={refreshKey} onSelectUser={setSelectedUid} onError={handleError} />
          )}
        </div>
      </main>

      {selectedUid ? (
        <UserDrawer uid={selectedUid} onClose={() => setSelectedUid(null)} onChanged={onChanged} onError={handleError} />
      ) : null}
    </div>
  )
}
