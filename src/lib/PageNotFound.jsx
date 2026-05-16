import React from 'react';
import { useLocation } from 'react-router-dom';
export default function PageNotFound() {
  const location = useLocation();
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="text-6xl font-black text-primary/20">404</div>
        <h2 className="text-xl font-bold">Page Not Found</h2>
        <p className="text-muted-foreground text-sm">"{location.pathname}" doesn't exist.</p>
        <button onClick={() => window.location.href='/'} className="inline-flex items-center px-6 py-3 text-sm font-semibold bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors">
          Go Home
        </button>
      </div>
    </div>
  );
}
