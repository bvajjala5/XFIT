import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X } from 'lucide-react';
import { registerPushNotifications } from '@/lib/notifications';

export default function NotificationSetup({ userId }) {
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userId) return;
    if (!('Notification' in window)) return;
    if (Notification.permission !== 'default') return;
    const dismissed = localStorage.getItem('xfit_notif_dismissed_' + userId);
    if (!dismissed) setTimeout(() => setShow(true), 3000);
  }, [userId]);

  async function handleEnable() {
    setLoading(true);
    await registerPushNotifications(userId);
    setLoading(false);
    setShow(false);
  }

  function handleDismiss() {
    localStorage.setItem('xfit_notif_dismissed_' + userId, '1');
    setShow(false);
  }

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          className="fixed bottom-24 left-4 right-4 z-40 max-w-sm mx-auto"
        >
          <div className="bg-card border border-border/60 rounded-2xl p-4 shadow-2xl flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center shrink-0 mt-0.5">
              <Bell className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold">Stay on track</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Get reminders if you haven't worked out in 2 days, and alerts when friends follow you.
              </p>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={handleEnable}
                  disabled={loading}
                  className="flex-1 h-8 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors disabled:opacity-60"
                >
                  {loading ? 'Enabling…' : 'Enable'}
                </button>
                <button
                  onClick={handleDismiss}
                  className="flex-1 h-8 rounded-xl bg-secondary/50 text-xs font-semibold hover:bg-secondary transition-colors"
                >
                  Not now
                </button>
              </div>
            </div>
            <button onClick={handleDismiss} className="text-muted-foreground hover:text-foreground shrink-0">
              <X className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
