import React, { useState, useRef, useEffect } from 'react'
import { db } from '@/lib/firebase'
import { collection, addDoc, getDocs, query, orderBy, deleteDoc, doc, serverTimestamp } from 'firebase/firestore'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/lib/AuthContext'
import GlassCard from '@/components/shared/GlassCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, X, Plus, Trash2, Loader2, ChevronDown, Apple } from 'lucide-react'
import { localDateStr } from '@/lib/utils'
import { toast } from 'sonner'

const MEAL_TYPES = ['Breakfast', 'Lunch', 'Dinner', 'Snack']
const GOALS = { calories: 2000, protein: 150, carbs: 250, fat: 65 }

// Use USDA FoodData Central API — no CORS issues, very reliable
async function searchFood(searchQuery) {
  try {
    const res = await fetch(
      `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(searchQuery)}&search_simple=1&action=process&json=1&page_size=20&fields=product_name,brands,nutriments,serving_size,code&nocache=1`
    )
    if (!res.ok) throw new Error('Search failed')
    const data = await res.json()
    return (data.products || [])
      .filter(p => p.product_name && p.nutriments?.['energy-kcal_100g'])
      .map(p => ({
        id: p.code || String(Math.random()),
        name: p.product_name,
        brand: p.brands || '',
        image: '',
        serving_size: p.serving_size || '100g',
        per100: {
          calories: Math.round(p.nutriments['energy-kcal_100g'] || 0),
          protein:  Math.round((p.nutriments['proteins_100g'] || 0) * 10) / 10,
          carbs:    Math.round((p.nutriments['carbohydrates_100g'] || 0) * 10) / 10,
          fat:      Math.round((p.nutriments['fat_100g'] || 0) * 10) / 10,
        }
      }))
      .filter(f => f.per100.calories > 0)
  } catch (err) {
    console.error('Food search error:', err)
    throw err
  }
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

function FoodSearchModal({ open, onClose, onAdd }) {
  const [searchText, setSearchText] = useState('')
  const [results, setResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [selected, setSelected] = useState(null)
  const [grams, setGrams] = useState(100)
  const [mealType, setMealType] = useState('Breakfast')
  const searchTimeout = useRef(null)

  useEffect(() => {
    if (!open) { setSearchText(''); setResults([]); setSelected(null); setGrams(100) }
  }, [open])

  async function doSearch(text) {
    if (!text.trim()) { setResults([]); return }
    setSearching(true)
    try {
      const r = await searchFood(text)
      setResults(r)
    } catch { toast.error('Search failed — try a different term') }
    finally { setSearching(false) }
  }

  function handleSearchChange(e) {
    const val = e.target.value
    setSearchText(val)
    clearTimeout(searchTimeout.current)
    searchTimeout.current = setTimeout(() => doSearch(val), 600)
  }

  function calcNutrition(per100, g) {
    const f = g / 100
    return {
      calories: Math.round(per100.calories * f),
      protein:  Math.round(per100.protein  * f * 10) / 10,
      carbs:    Math.round(per100.carbs    * f * 10) / 10,
      fat:      Math.round(per100.fat      * f * 10) / 10,
    }
  }

  function handleAdd() {
    if (!selected) return
    const nutrition = calcNutrition(selected.per100, grams)
    onAdd({ ...selected, grams, mealType, ...nutrition, loggedAt: new Date().toISOString() })
    onClose()
  }

  if (!open) return null
  const nutrition = selected ? calcNutrition(selected.per100, grams) : null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <motion.div initial={{ y:100, opacity:0 }} animate={{ y:0, opacity:1 }} exit={{ y:100, opacity:0 }}
        className="w-full max-w-lg bg-card border border-border rounded-t-3xl md:rounded-2xl"
        style={{ maxHeight: '85vh', overflowY: 'auto' }}>

        {/* Header */}
        <div className="sticky top-0 bg-card border-b border-border px-5 py-4 flex items-center justify-between rounded-t-3xl z-10">
          <h2 className="text-lg font-bold">Add Food</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {selected ? (
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center shrink-0">
                  <Apple className="w-6 h-6 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <p className="font-bold leading-tight">{selected.name}</p>
                  {selected.brand && <p className="text-xs text-muted-foreground mt-0.5">{selected.brand}</p>}
                  <button onClick={() => setSelected(null)} className="text-xs text-primary mt-1">← Back to search</button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold">Amount (grams)</label>
                <div className="flex gap-2 items-center">
                  <Input type="number" value={grams} onChange={e => setGrams(Math.max(1, Number(e.target.value)))}
                    className="bg-secondary/40 border-0 w-28 text-center text-lg font-bold h-12" />
                  <div className="flex gap-1 ml-auto">
                    {[50,100,150,200].map(g => (
                      <button key={g} onClick={() => setGrams(g)}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${grams===g?'bg-primary text-white':'bg-secondary text-muted-foreground hover:text-foreground'}`}>
                        {g}g
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <GlassCard className="grid grid-cols-4 gap-2 text-center">
                {[{label:'Calories',value:nutrition.calories,unit:'kcal',color:'text-orange-400'},
                  {label:'Protein', value:nutrition.protein, unit:'g',   color:'text-blue-400'},
                  {label:'Carbs',   value:nutrition.carbs,   unit:'g',   color:'text-yellow-400'},
                  {label:'Fat',     value:nutrition.fat,     unit:'g',   color:'text-pink-400'}].map(n => (
                  <div key={n.label}>
                    <div className={`text-lg font-black ${n.color}`}>{n.value}</div>
                    <div className="text-[9px] text-muted-foreground">{n.unit}</div>
                    <div className="text-[9px] text-muted-foreground">{n.label}</div>
                  </div>
                ))}
              </GlassCard>

              <div className="space-y-2">
                <label className="text-sm font-semibold">Meal</label>
                <div className="flex gap-2">
                  {MEAL_TYPES.map(m => (
                    <button key={m} onClick={() => setMealType(m)}
                      className={`flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all ${mealType===m?'bg-primary text-primary-foreground':'bg-secondary text-muted-foreground'}`}>
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              <Button className="w-full h-12 rounded-xl text-base gap-2" onClick={handleAdd}>
                <Plus className="w-4 h-4" /> Add to Log
              </Button>
            </div>
          ) : (
            <>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"/>
                <Input value={searchText} onChange={handleSearchChange}
                  placeholder="Search any food..."
                  className="pl-9 pr-10 bg-secondary/40 border-0 h-12" autoFocus />
                {searching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground"/>}
              </div>

              <div className="space-y-2">
                {results.length === 0 && searchText && !searching && (
                  <p className="text-center text-muted-foreground text-sm py-6">No results — try a different search term</p>
                )}
                {!searchText && (
                  <p className="text-center text-muted-foreground text-xs py-4">Type to search from the USDA food database</p>
                )}
                {results.map(food => (
                  <button key={food.id} onClick={() => setSelected(food)}
                    className="w-full text-left glass rounded-xl p-3 flex items-center gap-3 hover:border-primary/30 border border-transparent transition-all">
                    <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                      <Apple className="w-4 h-4 text-muted-foreground"/>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{food.name}</p>
                      {food.brand && <p className="text-xs text-muted-foreground truncate">{food.brand}</p>}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-bold text-orange-400 text-sm">{food.per100.calories}</p>
                      <p className="text-[10px] text-muted-foreground">kcal/100g</p>
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </motion.div>
    </div>
  )
}

export default function MealTracker({ userId }) {
  const [modalOpen, setModalOpen] = useState(false)
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

      <Button onClick={() => setModalOpen(true)} className="w-full h-12 rounded-xl gap-2 text-base">
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
                    <button onClick={() => setModalOpen(true)}
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

      <FoodSearchModal open={modalOpen} onClose={() => setModalOpen(false)} onAdd={addFood}/>
    </div>
  )
}
