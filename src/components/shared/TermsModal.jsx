import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";

export default function TermsModal({ userId }) {
  const [show, setShow] = useState(false);
  const [checkedTerms, setCheckedTerms] = useState(false);
  const [checkedPrivacy, setCheckedPrivacy] = useState(false);

  useEffect(() => {
    if (!userId) return;
    const agreed = localStorage.getItem("xfit_terms_agreed_" + userId);
    if (!agreed) setShow(true);
  }, [userId]);

  const handleAgree = () => {
    if (!checkedTerms || !checkedPrivacy) return;
    localStorage.setItem("xfit_terms_agreed_" + userId, "true");
    setShow(false);
    // Fire event so Home.jsx knows to show onboarding now
    window.dispatchEvent(new Event('terms_agreed'));
  };

  const canAgree = checkedTerms && checkedPrivacy;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <motion.div
            initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.92, opacity: 0 }}
            className="bg-card border border-border/50 rounded-3xl p-7 w-full max-w-lg shadow-2xl flex flex-col items-center text-center space-y-5">

            <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center">
              <span className="text-4xl">💪</span>
            </div>

            <div className="space-y-1">
              <h2 className="text-2xl font-black">Welcome to XFit!</h2>
              <p className="text-muted-foreground text-sm">Please review and agree to our terms before getting started.</p>
            </div>

            <div className="bg-secondary/30 rounded-2xl p-4 w-full text-left space-y-2 text-sm text-muted-foreground">
              <p>✅ We collect fitness data to power your experience</p>
              <p>✅ Your data is stored securely on Google Firebase</p>
              <p>✅ We never sell your personal data</p>
              <p>✅ You can delete your account anytime</p>
            </div>

            <div className="w-full space-y-3 text-left">
              <button onClick={() => setCheckedTerms(v => !v)}
                className="flex items-center gap-3 w-full group cursor-pointer">
                <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center flex-shrink-0 transition-all ${checkedTerms ? "bg-primary border-primary" : "border-border group-hover:border-primary/60"}`}>
                  {checkedTerms && <span className="text-white text-xs font-black">✓</span>}
                </div>
                <span className="text-sm text-muted-foreground">
                  I have read and agree to the{" "}
                  <Link to="/terms" className="text-primary underline font-medium" onClick={(e) => { e.stopPropagation(); setCheckedTerms(true); }}>
                    Terms of Service
                  </Link>
                </span>
              </button>

              <button onClick={() => setCheckedPrivacy(v => !v)}
                className="flex items-center gap-3 w-full group cursor-pointer">
                <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center flex-shrink-0 transition-all ${checkedPrivacy ? "bg-primary border-primary" : "border-border group-hover:border-primary/60"}`}>
                  {checkedPrivacy && <span className="text-white text-xs font-black">✓</span>}
                </div>
                <span className="text-sm text-muted-foreground">
                  I have read and agree to the{" "}
                  <Link to="/privacy" className="text-primary underline font-medium" onClick={(e) => { e.stopPropagation(); setCheckedPrivacy(true); }}>
                    Privacy Policy
                  </Link>
                </span>
              </button>
            </div>

            {!canAgree && (
              <p className="text-xs text-muted-foreground/60">Please check both boxes above to continue</p>
            )}

            <button onClick={handleAgree} disabled={!canAgree}
              className={`w-full h-13 py-3.5 rounded-2xl font-bold text-base transition-all ${canAgree
                ? "bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.98] shadow-lg"
                : "bg-secondary/40 text-muted-foreground/50 cursor-not-allowed"}`}>
              {canAgree ? "Let's Go! 💪" : "Check both boxes to continue"}
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}