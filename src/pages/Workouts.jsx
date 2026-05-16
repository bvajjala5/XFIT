import React, { useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { useQuery } from '@tanstack/react-query';
import WorkoutCard from '@/components/shared/WorkoutCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, SlidersHorizontal } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const types = ['all','hiit','yoga','strength','cardio','mobility'];
const categories = ['all','upper_body','lower_body','core','full_body','recovery','mindfulness'];
const difficulties = ['all','beginner','intermediate','advanced'];
const durations = ['all','15','30','45','60'];
const labelMap = {all:'All',hiit:'HIIT',yoga:'Yoga',strength:'Strength',cardio:'Cardio',mobility:'Mobility',upper_body:'Upper Body',lower_body:'Lower Body',core:'Core',full_body:'Full Body',recovery:'Recovery',mindfulness:'Mindfulness',beginner:'Beginner',intermediate:'Intermediate',advanced:'Advanced','15':'≤15 min','30':'≤30 min','45':'≤45 min','60':'≤60 min'};

export default function Workouts() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [catFilter, setCatFilter] = useState('all');
  const [diffFilter, setDiffFilter] = useState('all');
  const [durFilter, setDurFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  const { data: workouts = [], isLoading } = useQuery({
    queryKey: ['workouts'],
    queryFn: async () => {
      const snap = await getDocs(query(collection(db, 'workouts'), orderBy('title')));
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    }
  });

  const filtered = workouts.filter(w => {
    if (search && !w.title?.toLowerCase().includes(search.toLowerCase())) return false;
    if (typeFilter !== 'all' && w.type !== typeFilter) return false;
    if (catFilter !== 'all' && w.category !== catFilter) return false;
    if (diffFilter !== 'all' && w.difficulty !== diffFilter) return false;
    if (durFilter !== 'all' && w.duration > parseInt(durFilter)) return false;
    return true;
  });

  const FilterRow = ({ label, options, value, onChange }) => (
    <div className="space-y-2">
      <span className="text-xs text-muted-foreground font-medium">{label}</span>
      <div className="flex flex-wrap gap-1.5">
        {options.map(opt => (
          <Button key={opt} size="sm" variant={value===opt?'default':'secondary'} className="rounded-full text-xs h-7 px-3" onClick={() => onChange(opt)}>{labelMap[opt]||opt}</Button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Workout Library</h1>
        <p className="text-muted-foreground text-sm mt-0.5">{filtered.length} workouts available</p>
      </div>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search workouts..." value={search} onChange={e=>setSearch(e.target.value)} className="pl-9 rounded-xl bg-secondary/50 border-0 h-10" />
        </div>
        <Button variant={showFilters?'default':'secondary'} size="icon" className="rounded-xl h-10 w-10" onClick={() => setShowFilters(!showFilters)}>
          <SlidersHorizontal className="w-4 h-4" />
        </Button>
      </div>
      <AnimatePresence>
        {showFilters && (
          <motion.div initial={{opacity:0,height:0}} animate={{opacity:1,height:'auto'}} exit={{opacity:0,height:0}} className="overflow-hidden">
            <div className="glass rounded-2xl p-4 space-y-4">
              <FilterRow label="Type" options={types} value={typeFilter} onChange={setTypeFilter} />
              <FilterRow label="Category" options={categories} value={catFilter} onChange={setCatFilter} />
              <FilterRow label="Difficulty" options={difficulties} value={diffFilter} onChange={setDiffFilter} />
              <FilterRow label="Duration" options={durations} value={durFilter} onChange={setDurFilter} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {types.map(t => <Button key={t} size="sm" variant={typeFilter===t?'default':'secondary'} className="rounded-full text-xs shrink-0" onClick={() => setTypeFilter(t)}>{labelMap[t]}</Button>)}
      </div>
      {isLoading ? (
        <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {filtered.map((w,i) => <WorkoutCard key={w.id} workout={w} index={i} />)}
          {filtered.length===0 && <div className="col-span-full text-center py-20 text-muted-foreground">No workouts match your filters</div>}
        </div>
      )}
    </div>
  );
}
