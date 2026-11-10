import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download } from 'lucide-react';
import BrandMark from '@/components/brand/BrandMark';

export default function InstallBanner() {
  const [prompt, setPrompt] = useState(null);
  const [show, setShow] = useState(false);
  const [dismissed, setDismissed] = useState(() => localStorage.getItem('xfit_install_dismissed') === 'true');

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setPrompt(e);
      if (!dismissed) setShow(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, [dismissed]);

  // Keep the floating AI button clear of the install prompt on small screens.
  useEffect(() => {
    if (show) document.body.dataset.installBanner = 'true';
    else delete document.body.dataset.installBanner;
    return () => { delete document.body.dataset.installBanner; };
  }, [show]);

  const handleInstall = async () => {
    if (!prompt) return;
    prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === 'accepted') setShow(false);
  };

  const handleDismiss = () => {
    setShow(false);
    setDismissed(true);
    localStorage.setItem('xfit_install_dismissed', 'true');
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-20 left-4 right-4 z-40 max-w-md mx-auto">
          <div className="bg-card border border-border/50 rounded-2xl p-4 shadow-2xl flex items-center gap-3">
            <BrandMark className="h-10 w-10 rounded-xl" emblemClassName="w-7" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold">Install Uttar Fitness</p>
              <p className="text-xs text-muted-foreground">Add to home screen for the best experience</p>
            </div>
            <button onClick={handleInstall}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground text-xs font-bold rounded-xl hover:bg-primary/90 transition-colors flex-shrink-0">
              <Download className="w-3 h-3" />
              Install
            </button>
            <button onClick={handleDismiss} className="text-muted-foreground hover:text-foreground flex-shrink-0">
              <X className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}