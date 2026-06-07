import React, { useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy, doc, setDoc, getDoc } from "firebase/firestore";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/AuthContext";
import { Trophy, Plus, ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import GlassCard from "@/components/shared/GlassCard";

const EXERCISE_CATEGORIES = {
  "Strength": ["Bench Press","Squat","Deadlift","Overhead Press","Barbell Row","Pull-Up","Dip","Bicep Curl","Tricep Extension","Lateral Raise"],
  "Core": ["Plank","Ab Rollout","Russian Twist","Hanging Leg Raise","Dragon Flag"],
  "Cardio": ["1 Mile Run","5K Run","10K Run","400m Sprint","1 Min Burpees"],
  "Custom": [],
};

export default function PersonalRecords() {
  const { user } = useAuth();
  const [expanded, setExpanded] = useState("Strength");
  const [adding, setAdding] = useState(null);
  const [form, setForm] = useState({ value: "", unit: "lbs", notes: "" });

  const { data: records = {}, refetch } = useQuery({
    queryKey: ["personal-records", user?.uid],
    queryFn: async () => {
      const snap = await getDoc(doc(db, "users", user.uid, "personalRecords", "records"));
      return snap.exists() ? snap.data() : {};
    },
    enabled: !!user,
  });

  const handleSave = async (exercise) => {
    if (!form.value) return;
    const existing = records[exercise] || [];
    const newRecord = { value: Number(form.value), unit: form.unit, notes: form.notes, date: new Date().toISOString() };
    const updated = [newRecord, ...existing].slice(0, 10);
    const allRecords = { ...records, [exercise]: updated };
    await setDoc(doc(db, "users", user.uid, "personalRecords", "records"), allRecords);
    setAdding(null);
    setForm({ value: "", unit: "lbs", notes: "" });
    refetch();
  };

  const getBest = (exercise) => {
    const recs = records[exercise] || [];
    if (!recs.length) return null;
    return recs.reduce((best, r) => r.value > best.value ? r : best, recs[0]);
  };

  return (
    <div className="max-w-2xl mx-auto pb-28 px-4 pt-6 space-y-4">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-2xl bg-yellow-500/20 flex items-center justify-center"><Trophy className="w-5 h-5 text-yellow-500" /></div>
        <div><h1 className="text-xl font-black">Personal Records</h1><p className="text-xs text-muted-foreground">Track your best performances</p></div>
      </div>

      {Object.entries(EXERCISE_CATEGORIES).map(([cat, exercises]) => (
        <GlassCard key={cat} className="overflow-hidden p-0">
          <button onClick={() => setExpanded(e => e === cat ? null : cat)}
            className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors">
            <span className="font-semibold text-sm">{cat}</span>
            {expanded === cat ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
          </button>
          <AnimatePresence>
            {expanded === cat && (
              <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
                <div className="px-4 pb-4 space-y-2">
                  {exercises.map(ex => {
                    const best = getBest(ex);
                    const isAdding = adding === ex;
                    return (
                      <div key={ex} className="bg-secondary/30 rounded-xl p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium">{ex}</p>
                            {best ? (
                              <p className="text-xs text-yellow-500 font-bold">🏆 Best: {best.value} {best.unit}</p>
                            ) : (
                              <p className="text-xs text-muted-foreground">No record yet</p>
                            )}
                          </div>
                          <button onClick={() => setAdding(isAdding ? null : ex)}
                            className="w-8 h-8 rounded-xl bg-primary/20 text-primary flex items-center justify-center hover:bg-primary/30 transition-colors">
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                        <AnimatePresence>
                          {isAdding && (
                            <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
                              className="space-y-2 pt-2 border-t border-border/30">
                              <div className="flex gap-2">
                                <input type="number" placeholder="Value" value={form.value}
                                  onChange={e => setForm(f => ({ ...f, value: e.target.value }))}
                                  className="flex-1 bg-background border border-border/40 rounded-xl px-3 py-2 text-sm outline-none focus:border-primary/50" />
                                <select value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}
                                  className="bg-background border border-border/40 rounded-xl px-3 py-2 text-sm outline-none">
                                  <option>lbs</option><option>kg</option><option>reps</option><option>sec</option><option>min</option>
                                </select>
                              </div>
                              <input placeholder="Notes (optional)" value={form.notes}
                                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                                className="w-full bg-background border border-border/40 rounded-xl px-3 py-2 text-sm outline-none focus:border-primary/50" />
                              <button onClick={() => handleSave(ex)}
                                className="w-full h-9 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 transition-colors">
                                Save Record
                              </button>
                              {(records[ex] || []).slice(0, 3).map((r, i) => (
                                <div key={i} className="flex justify-between text-xs text-muted-foreground">
                                  <span>{new Date(r.date).toLocaleDateString()}</span>
                                  <span className="font-medium">{r.value} {r.unit}</span>
                                </div>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </GlassCard>
      ))}
    </div>
  );
}