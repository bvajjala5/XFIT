import { useEffect, useState } from 'react'
import { Search, RefreshCw, ChevronLeft, ChevronRight, Users as UsersIcon, Eye } from 'lucide-react'
import { api } from '../lib/api.js'
import { formatDate, timeAgo, goalLabel } from '../lib/format.js'
import { Avatar, Badge, Spinner, EmptyState } from './ui.jsx'

const PAGE_SIZE = 12

export default function Users({ refreshKey, onSelectUser, onError }) {
  const [search, setSearch] = useState('')
  const [debounced, setDebounced] = useState('')
  const [role, setRole] = useState('all')
  const [status, setStatus] = useState('all')
  const [page, setPage] = useState(1)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(search), 250)
    return () => window.clearTimeout(timer)
  }, [search])

  useEffect(() => {
    setPage(1)
  }, [debounced, role, status])

  useEffect(() => {
    let alive = true
    setLoading(true)
    api
      .listUsers({ search: debounced, role, status, page, pageSize: PAGE_SIZE, refresh: false })
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
  }, [debounced, role, status, page, refreshKey, onError])

  const users = data?.users ?? []
  const total = data?.total ?? 0
  const pages = data?.pages ?? 1

  return (
    <div className="stack">
      <section className="card">
        <div className="toolbar">
          <div className="search-field">
            <Search size={15} />
            <input
              type="search"
              value={search}
              placeholder="Search by name, email, or UID…"
              onChange={(event) => setSearch(event.target.value)}
              aria-label="Search users"
            />
          </div>

          <label className="select-field">
            <span>Role</span>
            <select value={role} onChange={(event) => setRole(event.target.value)}>
              <option value="all">All roles</option>
              <option value="admin">Admins</option>
              <option value="user">Users</option>
            </select>
          </label>

          <label className="select-field">
            <span>Status</span>
            <select value={status} onChange={(event) => setStatus(event.target.value)}>
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
            </select>
          </label>

          <div className="toolbar-spacer" />
          <span className="result-count">
            {loading ? <Spinner label="Loading users" /> : `${total} ${total === 1 ? 'user' : 'users'}`}
          </span>
        </div>

        {users.length === 0 && !loading ? (
          <EmptyState
            icon={UsersIcon}
            title="No users match"
            message="Try a different search term or clear the filters."
          />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Goal</th>
                  <th>Joined</th>
                  <th>Last seen</th>
                  <th aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.uid} className={user.disabled ? 'row-suspended' : undefined}>
                    <td>
                      <button type="button" className="user-cell" onClick={() => onSelectUser(user.uid)}>
                        <Avatar name={user.fullName} email={user.email} src={user.profilePicture} size={34} />
                        <span className="user-cell-text">
                          <span className="user-name">{user.fullName || user.displayName || 'Unnamed user'}</span>
                          <span className="user-email">{user.email || user.uid}</span>
                        </span>
                      </button>
                    </td>
                    <td>
                      <Badge tone={user.role === 'admin' ? 'purple' : 'neutral'}>{user.role === 'admin' ? 'Admin' : 'User'}</Badge>
                    </td>
                    <td>
                      <Badge tone={user.disabled ? 'red' : 'green'}>{user.disabled ? 'Suspended' : 'Active'}</Badge>
                    </td>
                    <td className="cell-muted">{goalLabel(user.fitnessGoal)}</td>
                    <td className="cell-muted">{formatDate(user.createdAt)}</td>
                    <td className="cell-muted">{timeAgo(user.lastSignInAt)}</td>
                    <td className="cell-actions">
                      <button type="button" className="icon-btn" onClick={() => onSelectUser(user.uid)} aria-label={`View ${user.fullName || user.email}`}>
                        <Eye size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="pager">
          <button type="button" className="btn btn-ghost" disabled={page <= 1 || loading} onClick={() => setPage((value) => Math.max(1, value - 1))}>
            <ChevronLeft size={15} /> Prev
          </button>
          <span className="pager-label">
            Page {data?.page ?? 1} of {pages}
          </span>
          <button type="button" className="btn btn-ghost" disabled={page >= pages || loading} onClick={() => setPage((value) => value + 1)}>
            Next <ChevronRight size={15} />
          </button>
        </div>
      </section>
    </div>
  )
}
