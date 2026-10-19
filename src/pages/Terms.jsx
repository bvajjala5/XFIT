import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
export default function Terms() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur border-b border-border/40 px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-secondary/50 transition-colors"><ArrowLeft className="w-5 h-5" /></button>
        <h1 className="font-bold text-lg">Terms of Service</h1>
      </div>
      <div className="max-w-2xl mx-auto px-6 py-8 space-y-6 text-sm text-muted-foreground leading-relaxed">
        <p className="text-xs">Last updated: June 2026</p>
        <section className="space-y-2"><h2 className="text-base font-semibold text-foreground">1. Acceptance of Terms</h2><p>By using XFit, you agree to these Terms of Service.</p></section>
        <section className="space-y-2"><h2 className="text-base font-semibold text-foreground">2. Use of Service</h2><ul className="list-disc pl-5 space-y-1"><li>XFit is a fitness tracking application for personal use</li><li>You must provide accurate information when creating your account</li><li>You must not use XFit for any unlawful purpose</li></ul></section>
        <section className="space-y-2"><h2 className="text-base font-semibold text-foreground">3. Health Disclaimer</h2><p>XFit is not a medical application. Always consult a qualified healthcare professional before starting any fitness program.</p></section>
        <section className="space-y-2"><h2 className="text-base font-semibold text-foreground">4. AI Features</h2><p>The custom workout builder uses Google Gemini AI to turn text you submit into a structured workout. Responses are AI-generated and should not replace professional medical or fitness advice.</p></section>
        <section className="space-y-2"><h2 className="text-base font-semibold text-foreground">5. Support and Donations</h2><p>Donations are voluntary and non-refundable. All donations go directly to the developer to fund app improvements.</p></section>
        <section className="space-y-2"><h2 className="text-base font-semibold text-foreground">6. Contact</h2><p>Questions? Email us at xfit.support@gmail.com</p></section>
      </div>
    </div>
  );
}