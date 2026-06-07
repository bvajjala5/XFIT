import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
export default function TermsModal({ userId }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (!userId) return;
    const agreed = localStorage.getItem("xfit_terms_agreed_" + userId);
    if (!agreed) setShow(true);
  }, [userId]);
  const handleAgree = () => {
    localStorage.setItem("xfit_terms_agreed_" + userId, "true");
    setShow(false);
  };
  return (
    <AnimatePresence>
      {show && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }}
            className="bg-card border border-border/50 rounded-3xl p-6 w-full max-w-md space-y-4 shadow-2xl">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center mx-auto"><span className="text-2xl">📋</span></div>
              <h2 className="text-lg font-bold">Welcome to XFit!</h2>
              <p className="text-sm text-muted-foreground">Please review and agree to our terms before getting started.</p>
            </div>
            <div className="bg-secondary/30 rounded-2xl p-4 space-y-2 text-sm text-muted-foreground">
              <p>✅ We collect fitness data to power your experience</p>
              <p>✅ Your data is stored securely on Google Firebase</p>
              <p>✅ We never sell your personal data</p>
              <p>✅ You can delete your account anytime</p>
            </div>
            <div className="text-xs text-center text-muted-foreground">
              By continuing you agree to our <Link to="/terms" className="text-primary underline" onClick={handleAgree}>Terms of Service</Link> and <Link to="/privacy" className="text-primary underline" onClick={handleAgree}>Privacy Policy</Link>
            </div>
            <button onClick={handleAgree} className="w-full h-12 rounded-2xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 active:scale-[0.98] transition-all">
              I Agree — Let's Go! 💪
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}