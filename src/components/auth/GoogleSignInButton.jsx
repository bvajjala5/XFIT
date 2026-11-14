import { useState } from 'react';
import { useAuth } from '@/lib/AuthContext'
import { cn } from '@/lib/utils'
import GoogleIcon from './GoogleIcon'

const VARIANTS = {
  primary: 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20',
  outline: 'border border-border bg-card/60 text-foreground hover:bg-secondary/80',
  light: 'bg-white text-gray-800 shadow-sm hover:bg-gray-50',
}

/**
 * Google sign-in CTA shared by the landing page, the demo, and the login sheet.
 * A successful sign-in updates AuthContext, so the current public route can
 * redirect itself to the authenticated dashboard.
 */
export default function GoogleSignInButton({
  className = '',
  label = 'Continue with Google',
  variant = 'outline',
  onError,
}) {
  const { signInWithGoogle } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleClick = async () => {
    if (loading) return
    setLoading(true)
    setError('')
    try {
      await signInWithGoogle()
    } catch (err) {
      // Closing the popup is a normal choice, not an error worth showing.
      if (err?.code === 'auth/popup-closed-by-user' || err?.code === 'auth/cancelled-popup-request') {
        setLoading(false)
        return
      }
      const message = 'Could not sign in. Please try again.'
      setError(message)
      onError?.(message)
      setLoading(false)
    }
  }

  return (
    <div className={cn('w-full', className)}>
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className={cn(
          'inline-flex h-12 w-full items-center justify-center gap-3 rounded-2xl px-5 text-sm font-semibold transition-all active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 disabled:pointer-events-none disabled:opacity-60',
          VARIANTS[variant] ?? VARIANTS.outline
        )}
      >
        {loading
          ? <span className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden="true" />
          : <GoogleIcon />}
        {loading ? 'Signing in…' : label}
      </button>
      {error && (
        <p role="alert" className="mt-2 text-center text-xs text-destructive">{error}</p>
      )}
    </div>
  )
}
