import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Check, ShieldCheck } from 'lucide-react'
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { serverTimestamp } from 'firebase/firestore/lite';
import { useAuth } from '@/lib/AuthContext';
import useFocusTrap from '@/hooks/useFocusTrap';
import BrandMark from '@/components/brand/BrandMark';

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

  // Portal to <body> so the screen sits above the desktop sidebar and mobile bottom nav,
  // instead of being trapped in the Home page's stacking context.
  return createPortal(
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] overflow-y-auto bg-background">
          {/* Soft glow so the full-screen screen still feels branded rather than empty. */}
          <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
            <div className="absolute -top-32 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-primary/20 blur-3xl" />
            <div className="absolute -bottom-40 right-0 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />
          </div>

          <motion.div
            ref={contentRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="terms-title"
            initial={{ scale: 0.97, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.97, opacity: 0 }}
            className="relative mx-auto flex min-h-[100dvh] w-full max-w-md flex-col justify-center px-6 text-center focus:outline-none"
            style={{
              paddingTop: 'calc(2.5rem + env(safe-area-inset-top))',
              paddingBottom: 'calc(2.5rem + env(safe-area-inset-bottom))',
            }}
            tabIndex={-1}>

            <div className="mb-6 flex justify-center">
              <div className="relative">
                <div className="absolute inset-0 rounded-3xl bg-primary/25 blur-xl" />
                <BrandMark className="relative h-20 w-20 rounded-3xl shadow-2xl" emblemClassName="w-14" />
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Before we begin</p>
              <h2 id="terms-title" className="text-[1.75rem] font-black leading-tight tracking-tight">Welcome to Uttar Fitness!</h2>
              <p className="mx-auto max-w-xs text-sm leading-relaxed text-muted-foreground">
                Please review and agree to our terms before getting started.
              </p>
            </div>

            <div className="mt-7 w-full space-y-3 rounded-3xl border border-border/50 bg-card/70 p-5 text-left backdrop-blur-md">
              {[
                'We collect fitness data to power your experience',
                'Your data is stored securely on Google Firebase',
                'We never sell your personal data',
                'You can delete your account anytime',
              ].map((item) => (
                <p key={item} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-500/15">
                    <Check className="h-3 w-3 text-green-400" strokeWidth={3} />
                  </span>
                  <span>{item}</span>
                </p>
              ))}
            </div>

            <div className="mt-6 w-full space-y-3 text-left">
              <button onClick={() => setCheckedTerms(v => !v)}
                aria-pressed={checkedTerms}
                className="flex w-full items-start gap-3 text-left group cursor-pointer">
                <span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border-2 transition-all ${checkedTerms ? "bg-primary border-primary" : "border-border group-hover:border-primary/60"}`}>
                  {checkedTerms && <Check className="w-4 h-4 text-white" strokeWidth={3} />}
                </span>
                <span className="text-sm leading-relaxed text-muted-foreground">
                  I have read and agree to the{" "}
                  <Link to="/terms" target="_blank" rel="noreferrer" className="font-medium text-primary underline" onClick={(e) => e.stopPropagation()}>
                    Terms of Service
                  </Link>
                </span>
              </button>

              <button onClick={() => setCheckedPrivacy(v => !v)}
                aria-pressed={checkedPrivacy}
                className="flex w-full items-start gap-3 text-left group cursor-pointer">
                <span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border-2 transition-all ${checkedPrivacy ? "bg-primary border-primary" : "border-border group-hover:border-primary/60"}`}>
                  {checkedPrivacy && <Check className="w-4 h-4 text-white" strokeWidth={3} />}
                </span>
                <span className="text-sm leading-relaxed text-muted-foreground">
                  I have read and agree to the{" "}
                  <Link to="/privacy" target="_blank" rel="noreferrer" className="font-medium text-primary underline" onClick={(e) => e.stopPropagation()}>
                    Privacy Policy
                  </Link>
                </span>
              </button>
            </div>

            <button onClick={handleAgree} disabled={!canAgree}
              className={`mt-7 w-full rounded-2xl py-3.5 text-base font-bold transition-all ${canAgree
                ? "bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.98] shadow-lg shadow-primary/20"
                : "bg-secondary/40 text-muted-foreground/50 cursor-not-allowed"}`}>
              {canAgree ? "Agree & continue" : "Agree to continue"}
            </button>

            <p className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground/60">
              <ShieldCheck className="h-3.5 w-3.5" /> Your data stays private and secure.
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
