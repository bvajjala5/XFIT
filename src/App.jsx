import { Suspense, lazy, useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/lib/AuthContext'
import AppLayout from '@/components/layout/AppLayout'
import NotFound from '@/components/shared/NotFound'
import Login from '@/pages/Login'
import Landing from '@/pages/Landing'
import BrandLoader from '@/components/brand/BrandLoader'
import { hasSessionHint } from '@/lib/session'

const Home = lazy(() => import('@/pages/Home'))
const WorkoutsAndRun = lazy(() => import('@/pages/WorkoutsAndRun'))
const WeeklyPlan = lazy(() => import('@/pages/WeeklyPlan'))
const WorkoutDetail = lazy(() => import('@/pages/WorkoutDetail'))
const WorkoutPlayer = lazy(() => import('@/pages/WorkoutPlayer'))
const Profile = lazy(() => import('@/pages/Profile'))
const Insights = lazy(() => import('@/pages/Insights'))
const CustomWorkoutBuilder = lazy(() => import('@/pages/CustomWorkoutBuilder'))
const Privacy = lazy(() => import('@/pages/Privacy'))
const Terms = lazy(() => import('@/pages/Terms'))
const PersonalRecords = lazy(() => import('@/pages/PersonalRecords'))
const WorkoutHistory = lazy(() => import('@/pages/WorkoutHistory'))
const Community = lazy(() => import('@/pages/Community'))
const Run = lazy(() => import('@/pages/Run'))
const Demo = lazy(() => import('@/pages/Demo'))

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-5">
        <BrandLoader size="lg" />
        <p className="text-sm font-semibold tracking-wide text-muted-foreground">Uttar Fitness</p>
      </div>
    </div>
  )
}

function AuthGuard({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <LoadingScreen />
  if (!user) return <Navigate to="/login" replace />
  return children
}

/**
 * `/` is the public pitch. Returning users are sent straight to the dashboard
 * so they never see the marketing page again. Visitors with a remembered
 * session see the branded loader for the moment Firebase takes to restore it,
 * which avoids flashing the landing page at a signed-in user.
 */
function PublicHome() {
  const { user, loading } = useAuth()
  const [sessionHint] = useState(hasSessionHint)

  if (loading && sessionHint) return <LoadingScreen />
  if (user) return <Navigate to="/home" replace />
  return <Landing />
}

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-64">
      <BrandLoader size="md" label="Loading…" />
    </div>
  )
}

/** Old /health deep links now live under Insights, keeping the Health section. */
function HealthRedirect() {
  const { search } = useLocation()
  const tab = new URLSearchParams(search).get('tab')
  const suffix = tab && tab !== 'overview' ? `?tab=${encodeURIComponent(tab)}` : ''
  return <Navigate to={`/insights${suffix}`} replace />
}

export default function App() {
  const { user } = useAuth()
  return (
    <Routes>
      <Route path="/" element={<PublicHome />} />
      <Route path="/login" element={user ? <Navigate to="/home" replace /> : <Login />} />
      <Route path="/demo" element={<Suspense fallback={<LoadingScreen />}><Demo /></Suspense>} />

      {/* Public legal pages, linked from the landing page before sign-in. */}
      <Route path="/privacy" element={<Suspense fallback={<LoadingScreen />}><Privacy /></Suspense>} />
      <Route path="/terms" element={<Suspense fallback={<LoadingScreen />}><Terms /></Suspense>} />

      {/* Full-screen pages */}
      <Route path="/player/:id" element={
        <AuthGuard><Suspense fallback={<LoadingScreen />}><WorkoutPlayer /></Suspense></AuthGuard>
      } />
      <Route path="/player/custom/:id" element={
        <AuthGuard><Suspense fallback={<LoadingScreen />}><WorkoutPlayer isCustom /></Suspense></AuthGuard>
      } />
      <Route path="/run" element={
        <AuthGuard><Suspense fallback={<LoadingScreen />}><Run /></Suspense></AuthGuard>
      } />

      {/* App pages with layout */}
      <Route element={<AuthGuard><AppLayout /></AuthGuard>}>
        <Route path="home" element={<Suspense fallback={<PageLoader />}><Home /></Suspense>} />
        <Route path="workouts" element={<Suspense fallback={<PageLoader />}><WorkoutsAndRun /></Suspense>} />
        <Route path="workouts/:id" element={<Suspense fallback={<PageLoader />}><WorkoutDetail /></Suspense>} />
        <Route path="plan" element={<Suspense fallback={<PageLoader />}><WeeklyPlan /></Suspense>} />
        <Route path="profile" element={<Suspense fallback={<PageLoader />}><Profile /></Suspense>} />
        <Route path="insights" element={<Suspense fallback={<PageLoader />}><Insights /></Suspense>} />
        <Route path="health" element={<HealthRedirect />} />
        <Route path="builder" element={<Suspense fallback={<PageLoader />}><CustomWorkoutBuilder /></Suspense>} />
        {/* Uttar AI is now a pop-up. Keep the old URL working by opening it on Home. */}
        <Route path="ai" element={<Navigate to="/home" replace state={{ openAI: true }} />} />
        {/* Redirects for old routes */}
        <Route path="ranks" element={<Navigate to="/home" replace />} />
        <Route path="stats" element={<Navigate to="/insights?view=stats" replace />} />
        <Route path="leaderboard" element={<Navigate to="/home" replace />} />
        <Route path="friends" element={<Navigate to="/profile" replace />} />
        <Route path="progress" element={<Navigate to="/home" replace />} />
        <Route path="records" element={<Suspense fallback={<PageLoader />}><PersonalRecords /></Suspense>} />
        <Route path="history" element={<Suspense fallback={<PageLoader />}><WorkoutHistory /></Suspense>} />
        <Route path="community" element={<Suspense fallback={<PageLoader />}><Community /></Suspense>} />
        <Route path="*" element={<NotFound title="Page not found" message="That page doesn’t exist. It may have moved or been removed." />} />
      </Route>
    </Routes>
  )
}
