import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/lib/AuthContext';
import { ArrowRight, ArrowLeft, Target, Gauge, Heart } from 'lucide-react';

const goals = [
  {id:'lose_weight',label:'Lose Weight',icon:'🔥',desc:'Burn fat and get lean'},
  {id:'build_muscle',label:'Build Muscle',icon:'💪',desc:'Gain strength and size'},
  {id:'improve_endurance',label:'Improve Endurance',icon:'🏃',desc:'Run further, last longer'},
  {id:'flexibility',label:'Flexibility',icon:'🧘',desc:'Move better, feel better'},
];
const levels = [
  {id:'beginner',label:'Beginner',desc:'New to working out'},
  {id:'intermediate',label:'Intermediate',desc:'6+ months experience'},
  {id:'advanced',label:'Advanced',desc:'2+ years experience'},
];
const workoutTypes = [
  {id:'hiit',label:'HIIT',icon:'⚡'},
  {id:'yoga',label:'Yoga',icon:'🧘'},
  {id:'strength',label:'Strength',icon:'🏋️'},
  {id:'cardio',label:'Cardio',icon:'❤️'},
  {id:'mobility',label:'Mobility',icon:'🤸'},
];

export default function Onboarding({ onComplete }) {
  const [step, setStep] = useState(0);
  const [goal, setGoal] = useState('');
  const [level, setLevel] = useState('');
  const [types, setTypes] = useState([]);
  const [saving, setSaving] = useState(false);
  const { updateUserData } = useAuth();

  const toggleType = id => setTypes(prev => prev.includes(id) ? prev.filter(t=>t!==id) : [...prev,id]);

  const handleFinish = async () => {
    setSaving(true);
    await updateUserData({ fitness_goal:goal, experience_level:level, preferred_types:types, onboarding_complete:true });
    setSaving(false);
    onComplete();
  };

  const canNext = step===0 ? !!goal : step===1 ? !!level : types.length>0;

  const steps = [
    <div key="goal" className="space-y-4">
      <div className="text-center mb-8">
        <Target className="w-10 h-10 text-primary mx-auto mb-3" />
        <h2 className="text-2xl font-bold">What's your goal?</h2>
        <p className="text-muted-foreground text-sm mt-1">We'll personalize your experience</p>
      </div>
      <div className="grid grid-cols-1 gap-3">
        {goals.map(g => (
          <button key={g.id} onClick={() => setGoal(g.id)} className={`glass rounded-2xl p-4 text-left transition-all ${goal===g.id?'border-primary bg-primary/10 ring-1 ring-primary':'hover:bg-secondary/50'}`}>
            <div className="flex items-center gap-3">
              <span className="text-2xl">{g.icon}</span>
              <div><div className="font-semibold">{g.label}</div><div className="text-xs text-muted-foreground">{g.desc}</div></div>
            </div>
          </button>
        ))}
      </div>
    </div>,
    <div key="level" className="space-y-4">
      <div className="text-center mb-8">
        <Gauge className="w-10 h-10 text-primary mx-auto mb-3" />
        <h2 className="text-2xl font-bold">Experience level?</h2>
        <p className="text-muted-foreground text-sm mt-1">We'll match your intensity</p>
      </div>
      <div className="grid grid-cols-1 gap-3">
        {levels.map(l => (
          <button key={l.id} onClick={() => setLevel(l.id)} className={`glass rounded-2xl p-4 text-left transition-all ${level===l.id?'border-primary bg-primary/10 ring-1 ring-primary':'hover:bg-secondary/50'}`}>
            <div className="font-semibold">{l.label}</div>
            <div className="text-xs text-muted-foreground">{l.desc}</div>
          </button>
        ))}
      </div>
    </div>,
    <div key="types" className="space-y-4">
      <div className="text-center mb-8">
        <Heart className="w-10 h-10 text-primary mx-auto mb-3" />
        <h2 className="text-2xl font-bold">What do you enjoy?</h2>
        <p className="text-muted-foreground text-sm mt-1">Select all that apply</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {workoutTypes.map(t => (
          <button key={t.id} onClick={() => toggleType(t.id)} className={`glass rounded-2xl p-4 text-center transition-all ${types.includes(t.id)?'border-primary bg-primary/10 ring-1 ring-primary':'hover:bg-secondary/50'}`}>
            <div className="text-2xl mb-1">{t.icon}</div>
            <div className="font-semibold text-sm">{t.label}</div>
          </button>
        ))}
      </div>
    </div>,
  ];

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-2 mb-8">
          {[0,1,2].map(i => (
            <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i===step?'w-8 bg-primary':i<step?'w-4 bg-primary/50':'w-4 bg-secondary'}`} />
          ))}
        </div>
        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{opacity:0,x:30}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-30}} transition={{duration:0.2}}>
            {steps[step]}
          </motion.div>
        </AnimatePresence>
        <div className="flex gap-3 mt-8">
          {step > 0 && <Button variant="secondary" onClick={() => setStep(s=>s-1)} className="rounded-xl"><ArrowLeft className="w-4 h-4" /></Button>}
          <Button className="flex-1 rounded-xl h-12 font-semibold" disabled={!canNext||saving} onClick={() => step<2?setStep(s=>s+1):handleFinish()}>
            {saving?'Saving...':step<2?'Continue':'Get Started'}
            {!saving&&<ArrowRight className="w-4 h-4 ml-2" />}
          </Button>
        </div>
      </div>
    </div>
  );
}
