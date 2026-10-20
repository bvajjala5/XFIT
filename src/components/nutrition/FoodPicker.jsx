import React, { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { collection, addDoc, getDocs, deleteDoc, doc, serverTimestamp } from 'firebase/firestore'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Search, X, Plus, Trash2, Loader2, Apple, ChefHat, ChevronLeft, Globe, Clock } from 'lucide-react'
import { toast } from 'sonner'
import { db } from '@/lib/firebase'
import GlassCard from '@/components/shared/GlassCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createFoodSearch, calcNutrition, compositeFromItems, defaultGrams } from '@/lib/foodSearch'

export const MEAL_TYPES = ['Breakfast', 'Lunch', 'Dinner', 'Snack']

const defaultMealForNow = () => { const h = new Date().getHours(); return h < 11 ? 'Breakfast' : h < 16 ? 'Lunch' : h < 21 ? 'Dinner' : 'Snack' }
const title = (f) => f.label || f.name
const clean = (o) => JSON.parse(JSON.stringify(o))        // Firestore rejects `undefined`

// The USDA list (~220 KB gzipped) is only downloaded the first time someone opens the food picker.
let enginePromise = null
function loadEngine() {
  if (!enginePromise) {
    enginePromise = Promise.all([import('@/data/foods.json'), import('@/lib/curatedFoods')])
      .then(([d, c]) => createFoodSearch(d.default, c.CURATED))
      .catch((e) => { enginePromise = null; throw e })
  }
  return enginePromise
}

// Packaged / brand-name foods (Open Food Facts) — only searched when the user asks, since it's grocery-product data.
async function searchPackaged(text) {
  const res = await fetch(`https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(text)}&search_simple=1&action=process&json=1&page_size=20&fields=product_name,brands,nutriments,serving_size,code`)
  if (!res.ok) throw new Error('Search failed')
  const data = await res.json()
  return (data.products || [])
    .filter((p) => p.product_name && p.nutriments?.['energy-kcal_100g'])
    .map((p) => ({
      id: `off-${p.code}`, name: p.product_name, brand: p.brands || '', source: 'online', servings: [],
      per100: {
        calories: Math.round(p.nutriments['energy-kcal_100g'] || 0),
        protein: Math.round((p.nutriments.proteins_100g || 0) * 10) / 10,
        carbs: Math.round((p.nutriments.carbohydrates_100g || 0) * 10) / 10,
        fat: Math.round((p.nutriments.fat_100g || 0) * 10) / 10,
      },
    }))
    .filter((f) => f.per100.calories > 0)
}

const recentKey = (uid) => `xfit_recent_foods_${uid}`
const loadRecent = (uid) => { try { return JSON.parse(localStorage.getItem(recentKey(uid)) || '[]') } catch { return [] } }
const saveRecent = (uid, food) => {
  try {
    const slim = clean({ id: food.id, name: food.name, label: food.label, brand: food.brand, source: food.source, per100: food.per100, servings: food.servings || [], ingredients: food.ingredients })
    const next = [slim, ...loadRecent(uid).filter((f) => f.id !== food.id)].slice(0, 15)
    localStorage.setItem(recentKey(uid), JSON.stringify(next))
  } catch { /* storage unavailable */ }
}

function FoodRow({ food, onClick, badge }) {
  return (
    <button onClick={() => onClick(food)} className="w-full text-left glass rounded-xl p-3 flex items-center gap-3 hover:border-primary/30 border border-transparent transition-all">
      <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center shrink-0">
        {food.source === 'meal' ? <ChefHat className="w-4 h-4 text-muted-foreground" /> : <Apple className="w-4 h-4 text-muted-foreground" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm truncate">{title(food)}{badge && <span className="ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-primary/20 text-primary align-middle">{badge}</span>}</p>
        {(food.brand || (food.label && food.label !== food.name)) && <p className="text-xs text-muted-foreground truncate">{food.brand || food.name}</p>}
      </div>
      <div className="text-right shrink-0">
        <p className="font-bold text-orange-400 text-sm">{food.per100.calories}</p>
        <p className="text-[10px] text-muted-foreground">kcal/100g</p>
      </div>
    </button>
  )
}

function Section({ label, children }) {
  return (<div className="space-y-2"><p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground px-1">{label}</p>{children}</div>)
}

function MacroCard({ n }) {
  return (
    <GlassCard className="grid grid-cols-4 gap-2 text-center">
      {[{ label: 'Calories', value: n.calories, unit: 'kcal', color: 'text-orange-400' }, { label: 'Protein', value: n.protein, unit: 'g', color: 'text-blue-400' },
        { label: 'Carbs', value: n.carbs, unit: 'g', color: 'text-yellow-400' }, { label: 'Fat', value: n.fat, unit: 'g', color: 'text-pink-400' }].map((m) => (
        <div key={m.label}><div className={`text-lg font-black ${m.color}`}>{m.value}</div><div className="text-[9px] text-muted-foreground">{m.unit}</div><div className="text-[9px] text-muted-foreground">{m.label}</div></div>
      ))}
    </GlassCard>
  )
}

function MealTypePicker({ value, onChange }) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-semibold">Meal</label>
      <div className="flex gap-2">
        {MEAL_TYPES.map((m) => (
          <button key={m} onClick={() => onChange(m)} className={`flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all ${value === m ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}>{m}</button>
        ))}
      </div>
    </div>
  )
}

export default function FoodPicker({ open, onClose, onAdd, userId, defaultMeal }) {
  const [engine, setEngine] = useState(null)
  const [engineError, setEngineError] = useState(false)
  const [view, setView] = useState('search')              // search | detail | meal | custom
  const [text, setText] = useState('')
  const [selected, setSelected] = useState(null)
  const [grams, setGrams] = useState(100)
  const [mealType, setMealType] = useState(defaultMealForNow())
  const [draft, setDraft] = useState(null)                // { title, items: [{food, grams}], save }
  const [online, setOnline] = useState(null)              // null = not searched, [] = no results
  const [onlineBusy, setOnlineBusy] = useState(false)
  const [custom, setCustom] = useState({ name: '', serving: '100', calories: '', protein: '', carbs: '', fat: '' })
  const qc = useQueryClient()

  useEffect(() => { if (open) loadEngine().then(setEngine).catch(() => setEngineError(true)) }, [open])
  useEffect(() => {
    if (open) { setMealType(defaultMeal || defaultMealForNow()); return }
    setView('search'); setText(''); setSelected(null); setDraft(null); setOnline(null)
  }, [open, defaultMeal])
  useEffect(() => { setOnline(null) }, [text])

  const { data: myFoods = [] } = useQuery({
    queryKey: ['custom-foods', userId],
    queryFn: async () => {
      const snap = await getDocs(collection(db, 'users', userId, 'customFoods'))
      return snap.docs.map((d) => ({ ...d.data(), id: `custom-${d.id}`, docId: d.id, createdAt: undefined }))
    },
    enabled: !!userId && open,
  })

  const result = useMemo(() => (engine && text.trim() ? engine.search(text) : null), [engine, text])
  const mealSuggestion = useMemo(() => (engine && text.trim() ? engine.parseMealQuery(text) : null), [engine, text])
  const myMatches = useMemo(() => {
    const q = text.trim().toLowerCase()
    return q ? myFoods.filter((f) => f.name.toLowerCase().includes(q)) : myFoods.slice(0, 6)
  }, [myFoods, text])
  const recent = useMemo(() => (open && userId ? loadRecent(userId) : []), [open, userId, view])

  if (!open) return null

  // ── actions ───────────────────────────────────────────────────────────────
  const pick = (food) => {
    if (draft) {                                   // we're building a meal: add as an ingredient
      setDraft({ ...draft, items: [...draft.items, { food, grams: defaultGrams(food) }] })
      setText(''); setView('meal'); return
    }
    setSelected(food); setGrams(food.source === 'custom' || food.source === 'meal' ? (food.servingGrams || 100) : defaultGrams(food)); setView('detail')
  }
  const startMeal = (m) => { setDraft({ title: m?.title || 'My meal', items: m?.items || [], save: true }); setText(''); setView('meal') }

  const finish = (entry) => { saveRecent(userId, entry.foodRef); onAdd(clean({ ...entry, foodRef: undefined })); onClose() }

  const addSelected = () => {
    const n = calcNutrition(selected.per100, grams)
    finish({ foodRef: selected, id: selected.id, name: title(selected), brand: selected.brand || '', source: selected.source, grams, mealType, ...n, per100: selected.per100, ingredients: selected.ingredients, loggedAt: new Date().toISOString() })
  }

  const addMeal = async () => {
    const items = draft.items.filter((i) => i.grams > 0)
    if (!items.length) return
    const comp = compositeFromItems(items)
    const ingredients = items.map(({ food, grams: g }) => ({ name: title(food), grams: g }))
    const food = { id: `meal-${Date.now()}`, name: draft.title.trim() || 'My meal', source: 'meal', per100: comp.per100, servings: [], servingGrams: comp.grams, ingredients }
    if (draft.save && userId) {
      try {
        const ref = await addDoc(collection(db, 'users', userId, 'customFoods'), clean({ name: food.name, source: 'meal', per100: food.per100, servingGrams: comp.grams, servings: [[`1 serving`, comp.grams]], ingredients, createdAt: serverTimestamp() }))
        food.id = `custom-${ref.id}`
        qc.invalidateQueries({ queryKey: ['custom-foods', userId] })
      } catch { toast.error("Couldn't save to My foods, but it will still be logged") }
    }
    finish({ foodRef: food, id: food.id, name: food.name, brand: '', source: 'meal', grams: comp.grams, mealType, calories: comp.calories, protein: comp.protein, carbs: comp.carbs, fat: comp.fat, per100: comp.per100, ingredients, loggedAt: new Date().toISOString() })
  }

  const saveCustom = async () => {
    const name = custom.name.trim(); const serving = Number(custom.serving) || 0
    const [cal, p, c, f] = ['calories', 'protein', 'carbs', 'fat'].map((k) => Number(custom[k]) || 0)
    if (!name || serving <= 0 || cal < 0) { toast.error('Add a name, a serving size and calories'); return }
    const per100 = { calories: Math.round((cal / serving) * 100), protein: Math.round((p / serving) * 1000) / 10, carbs: Math.round((c / serving) * 1000) / 10, fat: Math.round((f / serving) * 1000) / 10 }
    try {
      const ref = await addDoc(collection(db, 'users', userId, 'customFoods'), clean({ name, source: 'custom', per100, servingGrams: serving, servings: [[`1 serving`, serving]], createdAt: serverTimestamp() }))
      qc.invalidateQueries({ queryKey: ['custom-foods', userId] })
      const food = { id: `custom-${ref.id}`, docId: ref.id, name, source: 'custom', per100, servingGrams: serving, servings: [['1 serving', serving]] }
      setSelected(food); setGrams(serving); setView('detail')
    } catch { toast.error("Couldn't save that food — check your connection") }
  }

  const deleteMine = async (food, e) => {
    e.stopPropagation()
    try { await deleteDoc(doc(db, 'users', userId, 'customFoods', food.docId)); qc.invalidateQueries({ queryKey: ['custom-foods', userId] }) } catch { toast.error("Couldn't delete") }
  }

  const runOnline = async () => {
    setOnlineBusy(true)
    try { setOnline(await searchPackaged(text)) } catch { toast.error("Couldn't reach the packaged-food database"); setOnline(null) } finally { setOnlineBusy(false) }
  }

  // ── views ─────────────────────────────────────────────────────────────────
  const header = (
    <div className="sticky top-0 bg-card border-b border-border px-5 py-4 flex items-center justify-between rounded-t-3xl z-10">
      <h2 className="text-lg font-bold">{view === 'meal' ? 'Build a meal' : view === 'custom' ? 'Custom food' : 'Add Food'}</h2>
      <button onClick={onClose} aria-label="Close" className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center"><X className="w-4 h-4" /></button>
    </div>
  )

  let body
  if (view === 'detail' && selected) {
    const n = calcNutrition(selected.per100, grams)
    const chips = [...(selected.servings || []).map(([l, g]) => [l, Math.round(g)]), ['100 g', 100]].filter(([, g], i, a) => g > 0 && a.findIndex(([, x]) => x === g) === i).slice(0, 5)
    body = (
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center shrink-0">{selected.source === 'meal' ? <ChefHat className="w-6 h-6 text-muted-foreground" /> : <Apple className="w-6 h-6 text-muted-foreground" />}</div>
          <div className="flex-1">
            <p className="font-bold leading-tight">{title(selected)}</p>
            {(selected.brand || (selected.label && selected.label !== selected.name)) && <p className="text-xs text-muted-foreground mt-0.5">{selected.brand || selected.name}</p>}
            {selected.ingredients && <p className="text-xs text-muted-foreground mt-0.5">{selected.ingredients.map((i) => `${i.name} ${i.grams}g`).join(' · ')}</p>}
            <button onClick={() => setView('search')} className="text-xs text-primary mt-1 inline-flex items-center gap-0.5"><ChevronLeft className="w-3 h-3" />Back to search</button>
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold">Amount (grams)</label>
          <Input type="number" inputMode="decimal" value={grams} onChange={(e) => setGrams(Math.max(1, Number(e.target.value) || 1))} className="bg-secondary/40 border-0 w-32 text-center text-lg font-bold h-12" />
          <div className="flex flex-wrap gap-1.5">
            {chips.map(([label, g]) => (
              <button key={label + g} onClick={() => setGrams(g)} className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${grams === g ? 'bg-primary text-white' : 'bg-secondary text-muted-foreground hover:text-foreground'}`}>{label.length > 30 ? label.slice(0, 29) + '…' : label}{g !== 100 || label !== '100 g' ? ` · ${g}g` : ''}</button>
            ))}
          </div>
        </div>
        <MacroCard n={n} />
        <MealTypePicker value={mealType} onChange={setMealType} />
        <Button className="w-full h-12 rounded-xl text-base gap-2" onClick={addSelected}><Plus className="w-4 h-4" /> Add to Log</Button>
      </div>
    )
  } else if (view === 'meal' && draft) {
    const comp = compositeFromItems(draft.items.filter((i) => i.grams > 0))
    body = (
      <div className="space-y-4">
        <button onClick={() => { setDraft(null); setView('search') }} className="text-xs text-primary inline-flex items-center gap-0.5"><ChevronLeft className="w-3 h-3" />Cancel</button>
        <Input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} placeholder="Meal name" className="bg-secondary/40 border-0 h-11 font-semibold" />
        <div className="space-y-2">
          {draft.items.length === 0 && <p className="text-sm text-muted-foreground text-center py-3">Add the ingredients that went into it</p>}
          {draft.items.map((it, i) => (
            <div key={i} className="flex items-center gap-2 bg-secondary/30 rounded-xl px-3 py-2">
              <div className="flex-1 min-w-0"><p className="text-sm font-semibold truncate">{title(it.food)}</p><p className="text-[11px] text-muted-foreground">{calcNutrition(it.food.per100, it.grams).calories} kcal</p></div>
              <Input type="number" inputMode="decimal" value={it.grams} onChange={(e) => setDraft({ ...draft, items: draft.items.map((x, j) => (j === i ? { ...x, grams: Math.max(0, Number(e.target.value) || 0) } : x)) })} className="w-20 h-9 text-center bg-secondary/60 border-0" aria-label={`Grams of ${title(it.food)}`} />
              <span className="text-xs text-muted-foreground">g</span>
              <button onClick={() => setDraft({ ...draft, items: draft.items.filter((_, j) => j !== i) })} aria-label="Remove" className="text-red-400 hover:text-red-300"><Trash2 className="w-4 h-4" /></button>
            </div>
          ))}
          <button onClick={() => { setText(''); setView('search') }} className="w-full text-xs text-primary flex items-center justify-center gap-1 py-2 hover:bg-primary/5 rounded-xl"><Plus className="w-3.5 h-3.5" /> Add ingredient</button>
        </div>
        <MacroCard n={comp} />
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={draft.save} onChange={(e) => setDraft({ ...draft, save: e.target.checked })} /> Save to My foods so I can log it again</label>
        <MealTypePicker value={mealType} onChange={setMealType} />
        <Button className="w-full h-12 rounded-xl text-base gap-2" disabled={comp.grams <= 0} onClick={addMeal}><Plus className="w-4 h-4" /> Add to Log</Button>
      </div>
    )
  } else if (view === 'custom') {
    const field = (k, label, ph) => (
      <div className="space-y-1"><label className="text-xs font-semibold text-muted-foreground">{label}</label>
        <Input type="number" inputMode="decimal" value={custom[k]} placeholder={ph} onChange={(e) => setCustom({ ...custom, [k]: e.target.value })} className="bg-secondary/40 border-0 h-11" /></div>)
    body = (
      <div className="space-y-4">
        <button onClick={() => setView('search')} className="text-xs text-primary inline-flex items-center gap-0.5"><ChevronLeft className="w-3 h-3" />Back to search</button>
        <Input value={custom.name} onChange={(e) => setCustom({ ...custom, name: e.target.value })} placeholder="Food name (e.g. Mom's lasagna)" className="bg-secondary/40 border-0 h-11 font-semibold" autoFocus />
        <p className="text-xs text-muted-foreground">Enter the numbers for ONE serving (check the label), and how many grams that serving is.</p>
        <div className="grid grid-cols-2 gap-3">{field('serving', 'Serving size (g)', '100')}{field('calories', 'Calories', '250')}{field('protein', 'Protein (g)', '20')}{field('carbs', 'Carbs (g)', '30')}{field('fat', 'Fat (g)', '8')}</div>
        <Button className="w-full h-12 rounded-xl text-base" onClick={saveCustom}>Save food</Button>
      </div>
    )
  } else {
    const has = text.trim().length > 0
    const nothing = has && result && !result.curated.length && !result.usda.length && !myMatches.length
    body = (
      <>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={text} onChange={(e) => setText(e.target.value)} placeholder={draft ? 'Search an ingredient…' : 'Search any food… (try "banana" or "chicken and rice")'} className="pl-9 pr-10 bg-secondary/40 border-0 h-12" autoFocus />
          {!engine && !engineError && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />}
        </div>
        {draft && <p className="text-xs text-primary">Adding an ingredient to “{draft.title}” — <button className="underline" onClick={() => setView('meal')}>back to meal</button></p>}
        {engineError && <GlassCard className="text-sm text-center space-y-2"><p>Couldn't load the food database.</p><Button size="sm" onClick={() => { setEngineError(false); loadEngine().then(setEngine).catch(() => setEngineError(true)) }}>Try again</Button></GlassCard>}

        <div className="space-y-4">
          {!has && (
            <>
              {recent.length > 0 && <Section label="Recent">{recent.slice(0, 6).map((f) => <FoodRow key={f.id} food={f} onClick={pick} />)}</Section>}
              {myFoods.length > 0 && <Section label="My foods">{myFoods.slice(0, 6).map((f) => <FoodRow key={f.id} food={f} onClick={pick} badge={f.source === 'meal' ? 'Meal' : undefined} />)}</Section>}
              {!draft && <button onClick={() => startMeal(null)} className="w-full glass rounded-xl p-3 flex items-center gap-3 text-left hover:border-primary/30 border border-transparent"><ChefHat className="w-5 h-5 text-primary" /><div><p className="font-semibold text-sm">Build a meal</p><p className="text-xs text-muted-foreground">Combine foods, like chicken + rice, into one entry</p></div></button>}
              <p className="text-center text-muted-foreground text-xs py-2">Search 8,000+ foods from the USDA database</p>
            </>
          )}

          {has && mealSuggestion && !draft && (
            <button onClick={() => startMeal(mealSuggestion)} className="w-full rounded-xl p-3 flex items-center gap-3 text-left bg-primary/10 border border-primary/30">
              <ChefHat className="w-5 h-5 text-primary shrink-0" />
              <div className="flex-1 min-w-0"><p className="font-semibold text-sm">Log as one meal: {mealSuggestion.title}</p><p className="text-xs text-muted-foreground">{mealSuggestion.items.map((i) => `${title(i.food).replace(/,.*$/, '')} ${i.grams}g`).join(' + ')} — adjust amounts next</p></div>
              <span className="text-primary text-sm font-bold">→</span>
            </button>
          )}
          {has && myMatches.length > 0 && <Section label="My foods">{myMatches.map((f) => (
            <div key={f.id} className="relative"><FoodRow food={f} onClick={pick} badge={f.source === 'meal' ? 'Meal' : undefined} />
              <button onClick={(e) => deleteMine(f, e)} aria-label={`Delete ${f.name}`} className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-card border border-border text-red-400 flex items-center justify-center"><Trash2 className="w-3 h-3" /></button></div>))}</Section>}
          {has && result?.curated.length > 0 && <Section label="Everyday foods">{result.curated.map((f) => <FoodRow key={f.id} food={f} onClick={pick} />)}</Section>}
          {has && result?.usda.length > 0 && <Section label={result.curated.length ? 'More from USDA' : 'USDA foods'}>{result.usda.map((f) => <FoodRow key={f.id} food={f} onClick={pick} />)}</Section>}
          {nothing && <p className="text-center text-muted-foreground text-sm py-4">No match in the USDA list for “{text.trim()}”.</p>}

          {has && online && online.length > 0 && <Section label="Packaged foods (online)">{online.map((f) => <FoodRow key={f.id} food={f} onClick={pick} />)}</Section>}
          {has && online && online.length === 0 && <p className="text-center text-muted-foreground text-xs">No packaged foods found either.</p>}

          {has && (
            <div className="space-y-2 pt-1">
              {!online && <button onClick={runOnline} disabled={onlineBusy} className="w-full text-xs text-primary flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-primary/30 hover:bg-primary/5">{onlineBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Globe className="w-3.5 h-3.5" />} Search packaged &amp; brand-name foods online</button>}
              <button onClick={() => { setCustom({ ...custom, name: text.trim() }); setView('custom') }} className="w-full text-xs text-muted-foreground flex items-center justify-center gap-1.5 py-2 hover:text-foreground"><Plus className="w-3.5 h-3.5" /> Can't find it? Create a custom food</button>
            </div>
          )}
        </div>
      </>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/80 p-0 md:p-4" role="dialog" aria-modal="true" aria-label="Add food">
      <motion.div initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="w-full max-w-lg bg-card border border-border rounded-t-3xl md:rounded-2xl" style={{ maxHeight: '88vh', overflowY: 'auto', paddingBottom: 'env(safe-area-inset-bottom)' }}>
        {header}
        <div className="p-5 space-y-4">{body}</div>
      </motion.div>
    </div>
  )
}
