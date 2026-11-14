import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion'
import { MapContainer, TileLayer, Polyline, Circle, useMap } from 'react-leaflet'
import { Button } from '@/components/ui/button'
import { Play, Pause, Square, Navigation, Footprints, Flame } from 'lucide-react'
import 'leaflet/dist/leaflet.css'

// Map auto-pan to latest position
function MapFollower({ position }) {
  const map = useMap()
  useEffect(() => {
    if (position) map.setView(position, map.getZoom())
  }, [position, map])
  return null
}

// Haversine distance in meters
function haversine(a, b) {
  const R = 6371000
  const dLat = ((b[0] - a[0]) * Math.PI) / 180
  const dLon = ((b[1] - a[1]) * Math.PI) / 180
  const lat1 = (a[0] * Math.PI) / 180
  const lat2 = (b[0] * Math.PI) / 180
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x))
}

// Color path by pace
function getPaceColor(pace) {
  if (!pace || pace > 8) return '#94a3b8'     // slow - gray
  if (pace > 6) return '#fb923c'               // moderate - orange
  if (pace > 4) return '#4ade80'               // good - green
  return '#60a5fa'                              // fast - blue
}

const SPLIT_DIST = 1000 // 1km splits

export default function RunTracker({ onComplete, fullScreen = false }) {
  const [status, setStatus] = useState('idle') // idle | running | paused | done
  const [positions, setPositions] = useState([]) // [{lat, lng, timestamp, pace}]
  const [currentPos, setCurrentPos] = useState(null)
  const [elapsed, setElapsed] = useState(0) // seconds
  const [distance, setDistance] = useState(0) // meters
  const [steps, setSteps] = useState(0)
  const [splits, setSplits] = useState([]) // [{km, time}]
  const [calories, setCalories] = useState(0)
  const [gpsError, setGpsError] = useState(null)

  const watchIdRef = useRef(null)
  const timerRef = useRef(null)
  const stepCountRef = useRef(0)
  const lastStepTimeRef = useRef(0)
  const splitDistRef = useRef(0)
  const startTimeRef = useRef(null)
  const positionsRef = useRef([])
  const distanceRef = useRef(0)
  const caloriesRef = useRef(0)
  const elapsedRef = useRef(0)

  // Format elapsed time
  const formatTime = (s) => {
    const h = Math.floor(s / 3600)
    const m = Math.floor((s % 3600) / 60)
    const sec = s % 60
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
  }

  const distKm = (distance / 1000).toFixed(2)
  const pace = distance > 0 && elapsed > 0 ? (elapsed / 60) / (distance / 1000) : 0 // min/km
  const paceStr = pace > 0 ? `${Math.floor(pace)}:${String(Math.round((pace % 1) * 60)).padStart(2, '0')}` : '--:--'

  // Step detection via DeviceMotion
  const handleMotion = useCallback((e) => {
    if (status !== 'running') return
    const acc = e.accelerationIncludingGravity
    if (!acc) return
    const mag = Math.sqrt(acc.x ** 2 + acc.y ** 2 + acc.z ** 2)
    const now = Date.now()
    if (mag > 12 && now - lastStepTimeRef.current > 300) {
      lastStepTimeRef.current = now
      stepCountRef.current += 1
      setSteps(stepCountRef.current)
    }
  }, [status])

  useEffect(() => {
    window.addEventListener('devicemotion', handleMotion)
    return () => window.removeEventListener('devicemotion', handleMotion)
  }, [handleMotion])

  // Timer
  useEffect(() => {
    if (status === 'running') {
      timerRef.current = setInterval(() => {
        elapsedRef.current += 1
        setElapsed(elapsedRef.current)
      }, 1000)
    } else {
      clearInterval(timerRef.current)
    }
    return () => clearInterval(timerRef.current)
  }, [status])

  // GPS tracking
  useEffect(() => {
    if (status === 'running') {
      if (!navigator.geolocation) return
      watchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          const newPt = [pos.coords.latitude, pos.coords.longitude]
          setGpsError(null)
          const previous = positionsRef.current[positionsRef.current.length - 1]

          if (!previous) {
            const firstPoint = { pos: newPt, pace: 0, timestamp: pos.timestamp }
            positionsRef.current = [firstPoint]
            setPositions(positionsRef.current)
            setCurrentPos(newPt)
            return
          }

          const d = haversine(previous.pos, newPt)
          if (d < 3) return // ignore noise < 3m

          const newDist = distanceRef.current + d
          distanceRef.current = newDist
          const newCalories = Math.round((newDist / 1000) * 60) // ~60kcal/km average
          caloriesRef.current = newCalories
          setDistance(newDist)
          setCalories(newCalories)

          // Splits
          const totalSplitDistance = splitDistRef.current + d
          if (totalSplitDistance >= SPLIT_DIST) {
            splitDistRef.current = totalSplitDistance - SPLIT_DIST
            setSplits((sp) => [...sp, { km: sp.length + 1, time: elapsedRef.current }])
          } else {
            splitDistRef.current = totalSplitDistance
          }

          const segPace = d > 0 ? ((pos.timestamp - (previous.timestamp || pos.timestamp)) / 60000) / (d / 1000) : 0
          const point = { pos: newPt, pace: segPace, timestamp: pos.timestamp }
          positionsRef.current = [...positionsRef.current, point]
          setPositions(positionsRef.current)
          setCurrentPos(newPt)
        },
        (err) => {
          console.warn('GPS error', err)
          setGpsError(err?.code === 1
            ? 'Location permission denied — enable location access to track distance.'
            : 'Waiting for a GPS signal — distance may be inaccurate.')
        },
        { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 }
      )
    } else {
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current)
        watchIdRef.current = null
      }
    }
    return () => {
      if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current)
    }
  }, [status])

  // Wake Lock
  useEffect(() => {
    let lock = null
    if (status === 'running' && 'wakeLock' in navigator) {
      navigator.wakeLock.request('screen').then((l) => { lock = l }).catch(() => {})
    }
    return () => { if (lock) lock.release() }
  }, [status])

  function startRun() {
    startTimeRef.current = Date.now()
    positionsRef.current = []
    distanceRef.current = 0
    caloriesRef.current = 0
    elapsedRef.current = 0
    splitDistRef.current = 0
    stepCountRef.current = 0
    setPositions([])
    setDistance(0)
    setElapsed(0)
    setSteps(0)
    setSplits([])
    setCalories(0)
    setGpsError(null)
    setStatus('running')
  }

  function pauseRun() {
    setStatus('paused')
  }

  function resumeRun() {
    setStatus('running')
  }

  function finishRun() {
    setStatus('done')
    const finalDistance = distanceRef.current
    const finalElapsed = elapsedRef.current
    const summary = {
      distance: finalDistance,
      elapsed: finalElapsed,
      steps: stepCountRef.current,
      calories: caloriesRef.current,
      pace: finalDistance > 0 && finalElapsed > 0 ? (finalElapsed / 60) / (finalDistance / 1000) : 0,
      splits,
      route: positionsRef.current.map((p) => p.pos),
      startTime: startTimeRef.current,
    }
    if (onComplete) onComplete(summary)
  }

  const pathSegments = positions.reduce((acc, pt, i) => {
    if (i === 0) return acc
    const prev = positions[i - 1]
    acc.push({ points: [prev.pos, pt.pos], color: getPaceColor(pt.pace) })
    return acc
  }, [])

  if (status === 'idle') {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center gap-8 p-6 text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center shadow-xl shadow-primary/10"
        >
          <Navigation className="w-12 h-12 text-primary" />
        </motion.div>
        <div className="space-y-2">
          <h2 className="text-3xl font-black tracking-tight">Start a Run</h2>
          <p className="text-muted-foreground text-sm max-w-[240px] mx-auto leading-relaxed">
            GPS tracking • Pace coloring • Auto splits
          </p>
        </div>
        <Button onClick={startRun} size="lg" className="rounded-full w-44 h-16 text-xl font-bold gap-3 shadow-lg shadow-primary/20 active:scale-95 transition-transform">
          <Play className="w-6 h-6 fill-current" /> Go
        </Button>
      </div>
    )
  }

  return (
    <div className={`relative flex flex-col ${fullScreen ? 'h-full w-full' : 'h-auto'}`}>
      {gpsError && (
        <div className="absolute top-3 left-3 right-3 z-20 rounded-xl bg-red-500/15 border border-red-400/30 px-3 py-2 text-xs text-red-200">
          {gpsError}
        </div>
      )}
      {/* Map */}
      <div className={`${fullScreen ? 'absolute inset-0 z-0' : 'h-[400px] rounded-2xl overflow-hidden relative z-0'}`}>
        {currentPos ? (
          <MapContainer center={currentPos} zoom={17} style={{ height: '100%', width: '100%' }} zoomControl={false} scrollWheelZoom={false}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapFollower position={currentPos} />
            {pathSegments.map((seg, i) => (
              <Polyline key={i} positions={seg.points} color={seg.color} weight={4} opacity={0.9} />
            ))}
            <Circle center={currentPos} radius={5} color="#60a5fa" fillColor="#60a5fa" fillOpacity={1} />
          </MapContainer>
        ) : (
          <div className="h-full w-full bg-secondary/30 flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <Navigation className="w-8 h-8 mx-auto mb-2 animate-pulse" />
              <p className="text-sm">Acquiring GPS...</p>
            </div>
          </div>
        )}
      </div>

      {/* Stats overlay */}
      <div className={`${fullScreen ? 'absolute bottom-0 left-0 right-0 p-4 z-10' : 'p-4 space-y-4 relative z-10'} space-y-4 bg-gradient-to-t from-background via-background/80 to-transparent`}>
        {/* Primary stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="glass rounded-2xl p-3 text-center">
            <div className="text-2xl font-black">{distKm}</div>
            <div className="text-[10px] text-muted-foreground">KM</div>
          </div>
          <div className="glass rounded-2xl p-3 text-center">
            <div className="text-2xl font-black">{formatTime(elapsed)}</div>
            <div className="text-[10px] text-muted-foreground">TIME</div>
          </div>
          <div className="glass rounded-2xl p-3 text-center">
            <div className="text-2xl font-black">{paceStr}</div>
            <div className="text-[10px] text-muted-foreground">MIN/KM</div>
          </div>
        </div>

        {/* Secondary stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="glass rounded-2xl p-3 flex items-center gap-2">
            <Footprints className="w-4 h-4 text-green-400" />
            <div><div className="font-bold">{steps.toLocaleString()}</div><div className="text-[10px] text-muted-foreground">Steps</div></div>
          </div>
          <div className="glass rounded-2xl p-3 flex items-center gap-2">
            <Flame className="w-4 h-4 text-orange-400" />
            <div><div className="font-bold">{calories}</div><div className="text-[10px] text-muted-foreground">Calories</div></div>
          </div>
        </div>

        {/* Splits */}
        {splits.length > 0 && (
          <div className="glass rounded-2xl p-3 space-y-1 max-h-32 overflow-y-auto">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Splits</p>
            {splits.map((sp) => (
              <div key={sp.km} className="flex justify-between text-sm">
                <span className="text-muted-foreground">KM {sp.km}</span>
                <span className="font-mono font-semibold">{formatTime(sp.time)}</span>
              </div>
            ))}
          </div>
        )}

        {/* Controls */}
        <div className="flex gap-3">
          {status === 'running' ? (
            <Button variant="outline" className="flex-1 rounded-xl h-14 gap-2" onClick={pauseRun}>
              <Pause className="w-5 h-5" /> Pause
            </Button>
          ) : (
            <Button className="flex-1 rounded-xl h-14 gap-2" onClick={resumeRun}>
              <Play className="w-5 h-5 fill-current" /> Resume
            </Button>
          )}
          <Button variant="destructive" className="rounded-xl h-14 px-6 gap-2" onClick={finishRun}>
            <Square className="w-4 h-4 fill-current" /> Finish
          </Button>
        </div>
      </div>
    </div>
  )
}
