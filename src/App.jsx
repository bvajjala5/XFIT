import React, { Suspense, lazy } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '@/lib/AuthContext'
import AppLayout from '@/components/layout/AppLayout'
import Login from '@/pages/Login'
import { Loader2 } from 'lucide-react'

const Home = lazy(() => import('@/pages/Home'))
const Workouts = lazy(() => import('@/pages/Workouts'))
const WorkoutDetail = lazy(() => import('@/pages/WorkoutDetail'))
const WorkoutPlayer = lazy(() => import('@/pages/WorkoutPlayer'))
const Coach = lazy(() => import('@/pages/Coach'))
const Progress = lazy(() => import('@/pages/Progress'))
const Leaderboard = lazy(() => import('@/pages/Leaderboard'))
const Profile = lazy(() => import('@/pages/Profile'))
const HealthHub = lazy(() => import('@/pages/HealthHub'))
const CustomWorkoutBuilder = lazy(() => import('@/pages/CustomWorkoutBuilder'))
const Run = lazy(() => import('@/pages/Run'))

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center">
          <span className="text-3xl">⚡</span>
        </div>
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
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
      <Loader2 className="w-6 h-6 animate-spin text-primary" />
    </div>
  )
}

export default function App() {
  const { user, loading } = useAuth()

  if (loading) return <LoadingScreen />

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />

      {/* Full-screen pages (no AppLayout) */}
      <Route path="/player/:id" element={
        <AuthGuard>
          <Suspense fallback={<LoadingScreen />}>
            <WorkoutPlayer />
          </Suspense>
        </AuthGuard>
      } />
      <Route path="/player/custom/:id" element={
        <AuthGuard>
          <Suspense fallback={<LoadingScreen />}>
            <WorkoutPlayer isCustom />
          </Suspense>
        </AuthGuard>
      } />

      {/* App pages with layout */}
      <Route element={
        <AuthGuard>
          <AppLayout />
        </AuthGuard>
      }>
        <Route index element={<Suspense fallback={<PageLoader />}><Home /></Suspense>} />
        <Route path="workouts" element={<Suspense fallback={<PageLoader />}><Workouts /></Suspense>} />
        <Route path="workouts/:id" element={<Suspense fallback={<PageLoader />}><WorkoutDetail /></Suspense>} />
        <Route path="coach" element={<Suspense fallback={<PageLoader />}><Coach /></Suspense>} />
        <Route path="progress" element={<Suspense fallback={<PageLoader />}><Progress /></Suspense>} />
        <Route path="ranks" element={<Suspense fallback={<PageLoader />}><Leaderboard /></Suspense>} />
        <Route path="profile" element={<Suspense fallback={<PageLoader />}><Profile /></Suspense>} />
        <Route path="health" element={<Suspense fallback={<PageLoader />}><HealthHub /></Suspense>} />
        <Route path="builder" element={<Suspense fallback={<PageLoader />}><CustomWorkoutBuilder /></Suspense>} />
        <Route path="run" element={<Suspense fallback={<PageLoader />}><Run /></Suspense>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
