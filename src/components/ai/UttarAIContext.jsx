import { createContext, useContext } from 'react'

// Lets any page inside AppLayout open the Uttar AI coach that lives in the app
// chrome. Keeping the panel in one place means every entry point shares the
// same state, focus trap and preloaded bundle.
const UttarAIContext = createContext(() => {})

export function UttarAIProvider({ onOpen, children }) {
  return <UttarAIContext.Provider value={onOpen}>{children}</UttarAIContext.Provider>
}

export const useUttarAI = () => useContext(UttarAIContext)
