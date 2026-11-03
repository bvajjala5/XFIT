import React, { useState, useEffect, useRef } from "react";
import { Check } from 'lucide-react'
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { serverTimestamp } from 'firebase/firestore';
import { useAuth } from '@/lib/AuthContext';
import useFocusTrap from '@/hooks/useFocusTrap';

export default function TermsModal({ userId, onDismiss }) {
  const [show, setShow] = useState(false);
  const [checkedTerms, setCheckedTerms] = useState(false);
  const [checkedPrivacy, setCheckedPrivacy] = useState(false);
  const { userData, updateUserData } = useAuth();
  const contentRef = useRef(null);
  useFocusTrap(contentRef, show);

  useEffect(() => {
    if (!userId) return;
    const localAgreed = Boolean(localStorage.getItem("xfit_terms_agreed_" + userId));
    const accountAgreed = Boolean(userData?.terms_agreed_at);
    if (!localAgreed && !accountAgreed) setShow(true);
    if (accountAgreed && localAgreed) return;
    // Keep other devices in sync after acceptance.
    if (accountAgreed) localStorage.setItem("xfit_terms_agreed_" + userId, String(accountAgreed));
  }, [userId, userData?.terms_agreed_at]);

  const handleAgree = () => {
    if (!checkedTerms || !checkedPrivacy) return;
    const agreed = new Date().toISOString();
    localStorage.setItem("xfit_terms_agreed_" + userId, agreed);
    updateUserData({ terms_agreed_at: serverTimestamp() }).catch(error => {
      console.error('Could not sync terms consent:', error);
    });
    setShow(false);
    window.dispatchEvent(new Event('terms_agreed'));
    onDismiss?.();
  };

  const canAgree = checkedTerms && checkedPrivacy;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-background p-0">
          <motion.div
            ref={contentRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="terms-title"
            initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.92, opacity: 0 }}
            className="bg-card border-0 rounded-none p-7 w-full h-full shadow-none flex flex-col items-center justify-center text-center space-y-5 focus:outline-none"
            tabIndex={-1}>

            <img src="/icons/icon-192.png" alt="Uttar Fitness" width="64" height="64" className="w-16 h-16 rounded-2xl" />

            <div className="space-y-1">
              <h2 id="terms-title" className="text-2xl font-black">Welcome to Uttar Fitness!</h2>
              <p className="text-muted-foreground text-sm">Please review and agree to our terms before getting started.</p>
            </div>

            <div className="bg-secondary/30 rounded-2xl p-4 w-full text-left space-y-2 text-sm text-muted-foreground">
              <p className="flex items-start gap-2"><Check className="w-4 h-4 mt-0.5 shrink-0 text-green-400" /><span>We collect fitness data to power your experience</span></p>
              <p className="flex items-start gap-2"><Check className="w-4 h-4 mt-0.5 shrink-0 text-green-400" /><span>Your data is stored securely on Google Firebase</span></p>
              <p className="flex items-start gap-2"><Check className="w-4 h-4 mt-0.5 shrink-0 text-green-400" /><span>We never sell your personal data</span></p>
              <p className="flex items-start gap-2"><Check className="w-4 h-4 mt-0.5 shrink-0 text-green-400" /><span>You can delete your account anytime</span></p>
            </div>

            <div className="w-full space-y-3 text-left">
              <button onClick={() => setCheckedTerms(v => !v)}
                className="flex items-center gap-3 w-full group cursor-pointer">
                <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center flex-shrink-0 transition-all ${checkedTerms ? "bg-primary border-primary" : "border-border group-hover:border-primary/60"}`}>
                  {checkedTerms && <Check className="w-4 h-4 text-white" strokeWidth={3} />}
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
                  {checkedPrivacy && <Check className="w-4 h-4 text-white" strokeWidth={3} />}
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
              {canAgree ? "Let's go" : "Check both boxes to continue"}
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}