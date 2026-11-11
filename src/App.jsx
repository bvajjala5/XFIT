import React, { Suspense, lazy } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '@/lib/AuthContext'
import AppLayout from '@/components/layout/AppLayout'
import NotFound from '@/components/shared/NotFound'
import Login from '@/pages/Login'
import BrandLoader from '@/components/brand/BrandLoader'

const Home = lazy(() => import('@/pages/Home'))
const WorkoutsAndRun = lazy(() => import('@/pages/WorkoutsAndRun'))
const WeeklyPlan = lazy(() => import('@/pages/WeeklyPlan'))
const WorkoutDetail = lazy(() => import('@/pages/WorkoutDetail'))
const WorkoutPlayer = lazy(() => import('@/pages/WorkoutPlayer'))
const Profile = lazy(() => import('@/pages/Profile'))
const Stats = lazy(() => import('@/pages/Stats'))
const HealthHub = lazy(() => import('@/pages/HealthHub'))
const CustomWorkoutBuilder = lazy(() => import('@/pages/CustomWorkoutBuilder'))
const Privacy = lazy(() => import('@/pages/Privacy'))
const Terms = lazy(() => import('@/pages/Terms'))
const PersonalRecords = lazy(() => import('@/pages/PersonalRecords'))
const WorkoutHistory = lazy(() => import('@/pages/WorkoutHistory'))
const Community = lazy(() => import('@/pages/Community'))
const Run = lazy(() => import('@/pages/Run'))

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

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-64">
      <BrandLoader size="md" label="Loading…" />
    </div>
  )
}

export default function App() {
  const { user } = useAuth()
  // Do not gate the whole router on Firebase auth. AuthGuard already shows the
  // loading screen for protected routes, while /login can paint immediately so
  // signed-out visitors see content without waiting for auth to initialize.
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />

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
        <Route index element={<Suspense fallback={<PageLoader />}><Home /></Suspense>} />
        <Route path="workouts" element={<Suspense fallback={<PageLoader />}><WorkoutsAndRun /></Suspense>} />
        <Route path="workouts/:id" element={<Suspense fallback={<PageLoader />}><WorkoutDetail /></Suspense>} />
        <Route path="plan" element={<Suspense fallback={<PageLoader />}><WeeklyPlan /></Suspense>} />
        <Route path="profile" element={<Suspense fallback={<PageLoader />}><Profile /></Suspense>} />
        <Route path="health" element={<Suspense fallback={<PageLoader />}><HealthHub /></Suspense>} />
        <Route path="builder" element={<Suspense fallback={<PageLoader />}><CustomWorkoutBuilder /></Suspense>} />
        {/* Uttar AI is now a pop-up. Keep the old URL working by opening it on Home. */}
        <Route path="ai" element={<Navigate to="/" replace state={{ openAI: true }} />} />
        {/* Redirects for old routes */}
        <Route path="ranks" element={<Navigate to="/" replace />} />
        <Route path="stats" element={<Suspense fallback={<PageLoader />}><Stats /></Suspense>} />
        <Route path="leaderboard" element={<Navigate to="/" replace />} />
        <Route path="friends" element={<Navigate to="/profile" replace />} />
        <Route path="progress" element={<Navigate to="/" replace />} />
        <Route path="privacy" element={<Suspense fallback={<PageLoader />}><Privacy /></Suspense>} />
        <Route path="terms" element={<Suspense fallback={<PageLoader />}><Terms /></Suspense>} />
        <Route path="records" element={<Suspense fallback={<PageLoader />}><PersonalRecords /></Suspense>} />
        <Route path="history" element={<Suspense fallback={<PageLoader />}><WorkoutHistory /></Suspense>} />
        <Route path="community" element={<Suspense fallback={<PageLoader />}><Community /></Suspense>} />
        <Route path="*" element={<NotFound title="Page not found" message="That page doesn’t exist. It may have moved or been removed." />} />
      </Route>
    </Routes>
  )
}
