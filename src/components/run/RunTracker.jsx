import React, { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MapContainer, TileLayer, Polyline, Circle, useMap } from 'react-leaflet'
import { Button } from '@/components/ui/button'
import { Play, Pause, Square, Navigation, Footprints, Flame, Clock, ChevronUp } from 'lucide-react'
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

export default function RunTracker({ onComplete }) {
  const [status, setStatus] = useState('idle') // idle | running | paused | done
  const [positions, setPositions] = useState([]) // [{lat, lng, timestamp, pace}]
  const [currentPos, setCurrentPos] = useState(null)
  const [elapsed, setElapsed] = useState(0) // seconds
  const [distance, setDistance] = useState(0) // meters
  const [steps, setSteps] = useState(0)
  const [splits, setSplits] = useState([]) // [{km, time}]
  const [calories, setCalories] = useState(0)
  const [showStats, setShowStats] = useState(false)

  const watchIdRef = useRef(null)
  const timerRef = useRef(null)
  const stepCountRef = useRef(0)
  const lastStepTimeRef = useRef(0)
  const splitDistRef = useRef(0)
  const startTimeRef = useRef(null)
  const pausedTimeRef = useRef(0)

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
      timerRef.current = setInterval(() => setElapsed((s) => s + 1), 1000)
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
          setCurrentPos(newPt)
          setPositions((prev) => {
            if (prev.length === 0) return [{ pos: newPt, pace: 0 }]
            const last = prev[prev.length - 1].pos
            const d = haversine(last, newPt)
            if (d < 3) return prev // ignore noise < 3m
            const newDist = distance + d
            setDistance(newDist)
            setCalories(Math.round((newDist / 1000) * 60)) // ~60kcal/km average

            // Splits
            splitDistRef.current += d
            if (splitDistRef.current >= SPLIT_DIST) {
              splitDistRef.current -= SPLIT_DIST
              setSplits((sp) => [...sp, { km: sp.length + 1, time: elapsed }])
            }

            const segPace = d > 0 ? ((pos.timestamp - (prev[prev.length - 1].timestamp || pos.timestamp)) / 60000) / (d / 1000) : 0
            return [...prev, { pos: newPt, pace: segPace, timestamp: pos.timestamp }]
          })
        },
        (err) => console.warn('GPS error', err),
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
    const summary = {
      distance,
      elapsed,
      steps: stepCountRef.current,
      calories,
      pace,
      splits,
      route: positions.map((p) => p.pos),
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
      <div className="flex flex-col items-center justify-center gap-6 py-12">
        <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center">
          <Navigation className="w-10 h-10 text-primary" />
        </div>
        <div className="text-center">
          <h2 className="text-xl font-bold">Start a Run</h2>
          <p className="text-muted-foreground text-sm mt-1">GPS tracking • Pace coloring • Auto splits</p>
        </div>
        <Button onClick={startRun} size="lg" className="rounded-full w-40 h-14 text-lg gap-2">
          <Play className="w-5 h-5 fill-current" /> Go
        </Button>
      </div>
    )
  }

  return (
    <div className="relative h-full min-h-[60vh] flex flex-col">
      {/* Map */}
      <div className="flex-1 rounded-2xl overflow-hidden min-h-[300px]">
        {currentPos ? (
          <MapContainer center={currentPos} zoom={17} style={{ height: '100%', width: '100%', minHeight: 300 }} zoomControl={false}>
            <TileLayer
              attribution=""
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            />
            <MapFollower position={currentPos} />
            {pathSegments.map((seg, i) => (
              <Polyline key={i} positions={seg.points} color={seg.color} weight={4} opacity={0.9} />
            ))}
            <Circle center={currentPos} radius={5} color="#60a5fa" fillColor="#60a5fa" fillOpacity={1} />
          </MapContainer>
        ) : (
          <div className="h-full min-h-[300px] bg-secondary/30 rounded-2xl flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <Navigation className="w-8 h-8 mx-auto mb-2 animate-pulse" />
              <p className="text-sm">Acquiring GPS...</p>
            </div>
          </div>
        )}
      </div>

      {/* Stats overlay */}
      <div className="mt-4 space-y-4">
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
          <div className="glass rounded-2xl p-3 space-y-1">
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
