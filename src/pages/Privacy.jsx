import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
export default function Privacy() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur border-b border-border/40 px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} aria-label="Go back" className="p-2 rounded-xl hover:bg-secondary/50 transition-colors"><ArrowLeft className="w-5 h-5" aria-hidden="true" /></button>
        <h1 className="font-bold text-lg">Privacy Policy</h1>
      </div>
      <main className="max-w-2xl mx-auto px-6 py-8 space-y-6 text-sm text-muted-foreground leading-relaxed">
        <p className="text-xs">Last updated: November 2026</p>
        <section className="space-y-2"><h2 className="text-base font-semibold text-foreground">1. Introduction</h2><p>Welcome to Uttar Fitness, developed by Bhanu Vajjala. We are committed to protecting your personal information.</p></section>
        <section className="space-y-2"><h2 className="text-base font-semibold text-foreground">2. Information We Collect</h2><ul className="list-disc pl-5 space-y-1"><li>Google account info (name, email, profile photo)</li><li>Workout logs, health metrics, nutrition data, fitness goals</li><li>Text you submit to Uttar AI (sent to Google Gemini to generate an answer)</li><li>Form-check camera frames you choose to capture (sent to Google Gemini and not retained by Uttar Fitness)</li><li>Run files you choose to import (parsed on your device before saving)</li><li>Anonymous daily counts of feature use, such as workout starts and AI requests — never raw health values or message content</li></ul></section>
        <section className="space-y-2"><h2 className="text-base font-semibold text-foreground">3. How We Use Your Information</h2><ul className="list-disc pl-5 space-y-1"><li>To provide and improve the Uttar Fitness service</li><li>To personalize your fitness experience</li><li>To show your imported runs alongside runs recorded in the app</li><li>To power AI coaching via Google Gemini and manage optional AI allowances</li></ul></section>
        <section className="space-y-2"><h2 className="text-base font-semibold text-foreground">4. Data Storage</h2><p>Your data is stored securely using Google Firebase. We do not sell your personal data to third parties.</p></section>
        <section className="space-y-2"><h2 className="text-base font-semibold text-foreground">5. Third-Party Services</h2><ul className="list-disc pl-5 space-y-1"><li>Google Firebase</li><li>Google Gemini AI</li><li>Open Food Facts</li><li>USDA FoodData Central</li></ul></section>
        <section className="space-y-2"><h2 className="text-base font-semibold text-foreground">6. Data Deletion</h2><p>You can delete your account and all data at any time from the Profile tab.</p></section>
        <section className="space-y-2"><h2 className="text-base font-semibold text-foreground">7. Contact</h2><p>Questions? Email us at bhanu.charan.vajjala@gmail.com</p></section>
      </main>
    </div>
  );
}