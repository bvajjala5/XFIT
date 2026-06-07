import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, X } from "lucide-react";

export default function StreakProtection({ streak, userId, onUseFreeze }) {
  const [show, setShow] = useState(false);
  const freezesUsed = Number(localStorage.getItem("xfit_freezes_used_" + userId) || 0);
  const freezesLeft = Math.max(0, 1 - freezesUsed % 4);

  const handleUseFreeze = () => {
    localStorage.setItem("xfit_freezes_used_" + userId, String(freezesUsed + 1));
    localStorage.setItem("xfit_freeze_date_" + userId, new Date().toISOString().split("T")[0]);
    setShow(false);
    onUseFreeze?.();
  };

  return (
    <>
      <button onClick={() => setShow(true)}
        className="flex items-center gap-1.5 text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors">
        <Shield className="w-3.5 h-3.5" />
        {freezesLeft > 0 ? `${freezesLeft} freeze available` : "No freezes left"}
      </button>
      <AnimatePresence>
        {show && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              className="bg-card border border-border/50 rounded-3xl p-6 w-full max-w-sm shadow-2xl text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-blue-500/20 flex items-center justify-center mx-auto"><Shield className="w-7 h-7 text-blue-400" /></div>
              <div>
                <h2 className="text-xl font-black">Streak Freeze</h2>
                <p className="text-sm text-muted-foreground mt-1">Use a freeze to protect your {streak}-day streak if you miss a day</p>
              </div>
              <div className="bg-secondary/30 rounded-2xl p-4 text-sm text-muted-foreground space-y-1">
                <p>🛡️ {freezesLeft} freeze{freezesLeft !== 1 ? "s" : ""} remaining this month</p>
                <p>🔄 Freezes refresh every 4 uses</p>
                <p>⚡ Activates automatically if you miss a day</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setShow(false)} className="flex-1 h-11 rounded-2xl bg-secondary/50 text-sm font-semibold">Cancel</button>
                <button onClick={handleUseFreeze} disabled={freezesLeft === 0}
                  className="flex-1 h-11 rounded-2xl bg-blue-500/20 text-blue-400 text-sm font-bold hover:bg-blue-500/30 disabled:opacity-50 transition-colors">
                  Use Freeze
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}