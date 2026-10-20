import React, { useState, useEffect } from 'react'
import { db } from '@/lib/firebase'
import { collection, addDoc, getDocs, query, orderBy, deleteDoc, doc, serverTimestamp } from 'firebase/firestore'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/lib/AuthContext'
import GlassCard from '@/components/shared/GlassCard'
import { Button } from '@/components/ui/button'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Trash2, ChevronDown, Apple } from 'lucide-react'
import FoodPicker from '@/components/nutrition/FoodPicker'
import { localDateStr } from '@/lib/utils'
import { toast } from 'sonner'

const MEAL_TYPES = ['Breakfast', 'Lunch', 'Dinner', 'Snack']
function getGoals() {
  try {
    const stored = localStorage.getItem('xfit_nutrition_goals');
    if (stored) return JSON.parse(stored);
  } catch(e) {}
  return { calories: 2000, protein: 150, carbs: 250, fat: 65 };
}

function MacroBar({ label, value, goal, color }) {
  const pct = Math.min((value / goal) * 100, 100)
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-semibold">{Math.round(value)}<span className="text-muted-foreground">/{goal}g</span></span>
      </div>
      <div className="h-2 bg-secondary rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

export default function MealTracker({ userId }) {
  const [GOALS, setGOALS] = useState(getGoals)

  useEffect(() => {
    const handler = () => setGOALS(getGoals())
    window.addEventListener('storage', handler)
    // Also re-read on mount in case profile was updated
    setGOALS(getGoals())
    return () => window.removeEventListener('storage', handler)
  }, [])
  const [modalOpen, setModalOpen] = useState(false)
  const [pickerMeal, setPickerMeal] = useState(null)
  const [expandedMeal, setExpandedMeal] = useState(null)
  const queryClient = useQueryClient()
  const dateKey = localDateStr()

  const { data: foodLogs = [] } = useQuery({
    queryKey: ['food-logs', userId, dateKey],
    queryFn: async () => {
      if (!userId) return []
      try {
        const q = query(collection(db,'users',userId,'foodLogs',dateKey,'entries'), orderBy('loggedAt'))
        const snap = await getDocs(q)
        return snap.docs.map(d => ({ docId: d.id, ...d.data() }))
      } catch { return [] }
    },
    enabled: !!userId
  })

  async function addFood(food) {
    try {
      await addDoc(collection(db,'users',userId,'foodLogs',dateKey,'entries'), food)
      queryClient.invalidateQueries(['food-logs',userId,dateKey])
      toast.success(`${food.name.slice(0,30)} added!`)
    } catch { toast.error('Failed to add food') }
  }

  async function deleteFood(docId) {
    try {
      await deleteDoc(doc(db,'users',userId,'foodLogs',dateKey,'entries',docId))
      queryClient.invalidateQueries(['food-logs',userId,dateKey])
    } catch { toast.error('Failed to remove') }
  }

  const totals = foodLogs.reduce((acc,f) => ({
    calories: acc.calories+(f.calories||0),
    protein:  acc.protein +(f.protein||0),
    carbs:    acc.carbs   +(f.carbs||0),
    fat:      acc.fat     +(f.fat||0),
  }), { calories:0, protein:0, carbs:0, fat:0 })

  const calLeft = GOALS.calories - totals.calories
  const calPct  = Math.min((totals.calories/GOALS.calories)*100, 100)
  const byMeal  = MEAL_TYPES.reduce((acc,m) => { acc[m]=foodLogs.filter(f=>f.mealType===m); return acc }, {})

  return (
    <div className="space-y-5">
      {/* Daily calorie ring */}
      <GlassCard className="flex items-center gap-5">
        <div className="relative w-24 h-24 shrink-0">
          <svg viewBox="0 0 100 100" className="w-24 h-24 -rotate-90">
            <circle cx="50" cy="50" r="42" fill="none" stroke="hsl(var(--secondary))" strokeWidth="10"/>
            <circle cx="50" cy="50" r="42" fill="none"
              stroke={calLeft<0?'#f87171':'#f97316'} strokeWidth="10" strokeLinecap="round"
              strokeDasharray={2*Math.PI*42}
              strokeDashoffset={2*Math.PI*42*(1-calPct/100)}
              style={{transition:'stroke-dashoffset 1s ease'}}/>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className={`text-lg font-black leading-none ${calLeft<0?'text-red-400':'text-orange-400'}`}>{Math.abs(calLeft)}</span>
            <span className="text-[9px] text-muted-foreground leading-tight">{calLeft<0?'over':'left'}</span>
          </div>
        </div>
        <div className="flex-1 space-y-2.5">
          <div className="flex justify-between items-baseline">
            <span className="text-sm font-bold">Today's Calories</span>
            <span className="text-xs text-muted-foreground">{Math.round(totals.calories)} / {GOALS.calories}</span>
          </div>
          <MacroBar label="Protein" value={totals.protein} goal={GOALS.protein} color="bg-blue-400"/>
          <MacroBar label="Carbs"   value={totals.carbs}   goal={GOALS.carbs}   color="bg-yellow-400"/>
          <MacroBar label="Fat"     value={totals.fat}     goal={GOALS.fat}     color="bg-pink-400"/>
        </div>
      </GlassCard>

      <Button onClick={() => { setPickerMeal(null); setModalOpen(true) }} className="w-full h-12 rounded-xl gap-2 text-base">
        <Plus className="w-5 h-5"/> Log Food
      </Button>

      <div className="space-y-3">
        {MEAL_TYPES.map(meal => {
          const items = byMeal[meal]
          const mealCals = items.reduce((s,f) => s+(f.calories||0),0)
          const isExpanded = expandedMeal===meal
          const icons = {Breakfast:'🌅',Lunch:'☀️',Dinner:'🌙',Snack:'🍎'}
          return (
            <GlassCard key={meal} className="space-y-2">
              <button className="w-full flex items-center justify-between" onClick={() => setExpandedMeal(isExpanded?null:meal)}>
                <div className="flex items-center gap-2">
                  <span className="text-lg">{icons[meal]}</span>
                  <span className="font-semibold">{meal}</span>
                  {items.length>0 && <span className="text-xs text-muted-foreground">({items.length})</span>}
                </div>
                <div className="flex items-center gap-2">
                  {mealCals>0 && <span className="text-sm font-bold text-orange-400">{mealCals} kcal</span>}
                  <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${isExpanded?'rotate-180':''}`}/>
                </div>
              </button>
              <AnimatePresence>
                {isExpanded && (
                  <motion.div initial={{height:0,opacity:0}} animate={{height:'auto',opacity:1}} exit={{height:0,opacity:0}} className="overflow-hidden space-y-2">
                    {items.length===0 && <p className="text-xs text-muted-foreground text-center py-3">Nothing logged yet</p>}
                    {items.map(food => (
                      <div key={food.docId} className="flex items-center gap-3 bg-secondary/30 rounded-xl px-3 py-2">
                        <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                          <Apple className="w-4 h-4 text-muted-foreground"/>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate">{food.name}</p>
                          <p className="text-[11px] text-muted-foreground">{food.grams}g · P:{food.protein}g C:{food.carbs}g F:{food.fat}g</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-bold text-orange-400">{food.calories}</p>
                          <p className="text-[10px] text-muted-foreground">kcal</p>
                        </div>
                        <button onClick={() => deleteFood(food.docId)} className="text-red-400 hover:text-red-300 ml-1">
                          <Trash2 className="w-4 h-4"/>
                        </button>
                      </div>
                    ))}
                    <button onClick={() => { setPickerMeal(meal); setModalOpen(true) }}
                      className="w-full text-xs text-primary flex items-center justify-center gap-1 py-2 hover:bg-primary/5 rounded-xl transition-all">
                      <Plus className="w-3.5 h-3.5"/> Add to {meal}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </GlassCard>
          )
        })}
      </div>

      <FoodPicker open={modalOpen} onClose={() => setModalOpen(false)} onAdd={addFood} userId={userId} defaultMeal={pickerMeal}/>
    </div>
  )
}
