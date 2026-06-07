import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Trophy, Flame, Clock, Dumbbell } from "lucide-react";

export default function WeeklyRecap({ logs = [], open, onDismiss }) {
  const controlled = open !== undefined;
  const [show, setShow] = useState(controlled ? open : false);

  // Controlled mode: sync with open prop
  useEffect(() => {
    if (controlled) setShow(open);
  }, [open, controlled]);

  // Uncontrolled mode: self-manage (Sundays only, once per week)
  useEffect(() => {
    if (controlled) return;
    const today = new Date();
    if (today.getDay() !== 0) return;
    const lastShown = localStorage.getItem("xfit_recap_shown");
    const thisWeek = `${today.getFullYear()}-W${Math.ceil(today.getDate()/7)}`;
    if (lastShown !== thisWeek) {
      setTimeout(() => setShow(true), 2000);
      localStorage.setItem("xfit_recap_shown", thisWeek);
    }
  }, [controlled]);

  const weekLogs = logs.filter(l => {
    const d = l.completedAt?.toDate?.();
    if (!d) return false;
    const diff = (Date.now() - d.getTime()) / (1000 * 60 * 60 * 24);
    return diff <= 7;
  });

  const totalMins = Math.round(weekLogs.reduce((s, l) => s + (l.duration_seconds || 0), 0) / 60);
  const totalCals = weekLogs.reduce((s, l) => s + (l.calories_burned || 0), 0);

  if (!show || weekLogs.length === 0) return null;

  return (
    <AnimatePresence>
      {show && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
            className="relative bg-card border border-border/50 rounded-3xl p-7 w-full max-w-sm shadow-2xl text-center space-y-5">
            <button onClick={() => { setShow(false); onDismiss?.(); }} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
            <div className="space-y-1">
              <p className="text-xs font-bold text-primary uppercase tracking-wider">Weekly Recap 🎉</p>
              <h2 className="text-2xl font-black">Great week!</h2>
              <p className="text-muted-foreground text-sm">Here is what you accomplished this week</p>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                { icon: Dumbbell, label: "Workouts", value: weekLogs.length, color: "text-primary" },
                { icon: Clock, label: "Minutes", value: totalMins, color: "text-green-400" },
                { icon: Flame, label: "Calories", value: totalCals, color: "text-orange-400" },
              ].map(({ icon: Icon, label, value, color }) => (
                <div key={label} className="bg-secondary/30 rounded-2xl p-3 space-y-1">
                  <Icon className={`w-5 h-5 ${color} mx-auto`} />
                  <p className={`text-xl font-black ${color}`}>{value}</p>
                  <p className="text-[10px] text-muted-foreground">{label}</p>
                </div>
              ))}
            </div>
            <button onClick={() => { setShow(false); onDismiss?.(); }}
              className="w-full h-12 rounded-2xl bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-all">
              Keep it up! 💪
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}