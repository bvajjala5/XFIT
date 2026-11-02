import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import GlassCard from '@/components/shared/GlassCard';
import { Input } from '@/components/ui/input';
import { Dumbbell, Moon, Utensils, Footprints, Target, ChevronDown, ChevronUp, Pencil, Check, X, ArrowUp, ArrowDown } from 'lucide-react';

const GOAL_CATEGORIES = [
  {key:'workout',Icon:Dumbbell,label:'Workout Goals',goals:[{id:'workouts_per_week',label:'Workouts per week',unit:'days/week',default:3},{id:'mins_per_session',label:'Minutes per session',unit:'min',default:30},{id:'weekly_minutes',label:'Total weekly minutes',unit:'min/week',default:150}]},
  {key:'nutrition',Icon:Utensils,label:'Nutrition Goals',goals:[{id:'daily_calories',label:'Daily calories',unit:'cal',default:2200},{id:'daily_protein',label:'Daily protein',unit:'g',default:150},{id:'daily_water',label:'Daily water',unit:'glasses',default:8}]},
  {key:'sleep',Icon:Moon,label:'Sleep Goals',goals:[{id:'sleep_hours',label:'Sleep duration',unit:'hrs/night',default:8},{id:'bedtime',label:'Target bedtime',unit:'PM',default:'10:30'},{id:'wake_time',label:'Target wake time',unit:'AM',default:'6:30'}]},
  {key:'activity',Icon:Footprints,label:'Activity Goals',goals:[{id:'daily_steps',label:'Daily steps',unit:'steps',default:10000},{id:'weekly_distance',label:'Weekly distance',unit:'miles',default:15},{id:'active_calories',label:'Active calories/day',unit:'cal',default:500}]},
];

export default function GoalsCard() {
  const { userData, updateUserData } = useAuth();
  const [goalExpanded, setGoalExpanded] = useState({workout:false,nutrition:false,sleep:false,activity:false});
  const [editingGoal, setEditingGoal] = useState(null);
  const [editGoalVal, setEditGoalVal] = useState('');
  const [goalData, setGoalData] = useState({});

  useEffect(() => {
    if (userData) {
      const saved = userData.goals||{};
      const result = {};
      GOAL_CATEGORIES.forEach(cat=>cat.goals.forEach(g=>{result[g.id]=saved[g.id]||{current:g.default,history:[]}}));
      setGoalData(result);
    }
  }, [userData]);

  const saveGoal = async (id, newVal) => {
    const prev = goalData[id]?.current;
    const history = [...(goalData[id]?.history||[]),{value:prev,updatedAt:new Date().toISOString()}];
    const updated = {...goalData,[id]:{current:newVal,history}};
    setGoalData(updated);
    setEditingGoal(null);
    await updateUserData({goals:updated});
    // Sync to localStorage so WaterTracker, MealTracker, HealthHub pick up changes
    const v = Number(newVal);
    if (id === 'daily_water') localStorage.setItem('xfit_water_goal', String(v));
    if (id === 'daily_steps') localStorage.setItem('xfit_steps_goal', String(v));
    if (id === 'workouts_per_week') localStorage.setItem('xfit_goals_workouts_per_week', String(v));
    if (id === 'active_calories') localStorage.setItem('xfit_goals_weekly_calories', String(v * 7));
    if (id === 'weekly_minutes') localStorage.setItem('xfit_goals_weekly_minutes', String(v));
    if (id === 'mins_per_session') localStorage.setItem('xfit_goals_mins_per_session', String(v));
    if (id === 'sleep_hours') localStorage.setItem('xfit_sleep_goal', String(v));
    if (id === 'active_calories') localStorage.setItem('xfit_calories_goal', String(v));
    if (['daily_calories','daily_protein','daily_carbs','daily_fat'].includes(id)) {
      const ng = JSON.parse(localStorage.getItem('xfit_nutrition_goals') || '{"calories":2000,"protein":150,"carbs":250,"fat":65}');
      const km = {daily_calories:'calories',daily_protein:'protein',daily_carbs:'carbs',daily_fat:'fat'};
      ng[km[id]] = v;
      localStorage.setItem('xfit_nutrition_goals', JSON.stringify(ng));
      window.dispatchEvent(new Event('storage'));
    }
    if (id === 'daily_water') window.dispatchEvent(new Event('storage'));
  };

  function getTrend(current, prev) {
    if (prev==null) return null;
    const c=parseFloat(current), p=parseFloat(prev);
    if (c>p) return 'up'; if (c<p) return 'down'; return 'same';
  }

  return (
      <GlassCard className="space-y-3">
        <h2 className="font-semibold text-sm flex items-center gap-2"><Target className="w-4 h-4" /> My Goals</h2>
        {GOAL_CATEGORIES.map(cat=>(
          <div key={cat.key}>
            <button className="w-full flex items-center justify-between py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors" onClick={()=>setGoalExpanded(e=>({...e,[cat.key]:!e[cat.key]}))}>
              <span className="flex items-center gap-2"><cat.Icon className="w-4 h-4" />{cat.label}</span>{goalExpanded[cat.key]?<ChevronUp className="w-4 h-4"/>:<ChevronDown className="w-4 h-4"/>}
            </button>
            {goalExpanded[cat.key] && (
              <div className="space-y-2 pb-2">
                {cat.goals.map(g=>{
                  const gd=goalData[g.id]||{current:g.default,history:[]};
                  const prev=gd.history?.slice(-1)[0]?.value;
                  const trend=getTrend(gd.current,prev);
                  const isEdit=editingGoal===g.id;
                  return (
                    <div key={g.id} className="flex items-center justify-between gap-2 bg-secondary/30 rounded-xl px-3 py-2">
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium truncate">{g.label}</div>
                        {prev!=null&&<div className="text-[10px] text-muted-foreground">Previously: {prev} {g.unit}</div>}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {trend==='up'&&<ArrowUp className="w-3.5 h-3.5 text-green-400"/>}
                        {trend==='down'&&<ArrowDown className="w-3.5 h-3.5 text-red-400"/>}
                        {isEdit ? (
                          <div className="flex items-center gap-1">
                            <Input value={editGoalVal} onChange={e=>setEditGoalVal(e.target.value)} className="w-20 h-7 text-xs bg-background border-border rounded-lg px-2" autoFocus/>
                            <button onClick={()=>saveGoal(g.id,editGoalVal)} className="text-green-400 p-1"><Check className="w-3 h-3"/></button>
                            <button onClick={()=>setEditingGoal(null)} className="text-muted-foreground p-1"><X className="w-3 h-3"/></button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-primary">{gd.current} <span className="text-[10px] text-muted-foreground font-normal">{g.unit}</span></span>
                            <button onClick={()=>{setEditingGoal(g.id);setEditGoalVal(String(gd.current));}} className="text-muted-foreground hover:text-foreground p-1"><Pencil className="w-3 h-3"/></button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </GlassCard>
  );
}
