import React, { useState, useEffect } from 'react'
import { X, Info } from 'lucide-react'
import { Link } from 'react-router-dom'

export const CookieConsent: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const consent = localStorage.getItem('devstudio_cookie_consent')
    if (!consent) {
      setIsVisible(true)
    }
  }, [])

  const handleDismiss = () => {
    localStorage.setItem('devstudio_cookie_consent', 'true')
    setIsVisible(false)
  }

  if (!isVisible) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-md z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
      <div className="bg-[#0A0F1D] border border-border-default shadow-2xl rounded-2xl p-4 flex items-start gap-4 pr-12 relative">
        <Info className="w-5 h-5 text-accent-teal flex-shrink-0 mt-0.5" />
        <div className="text-xs text-text-muted font-sans font-medium leading-relaxed">
          This site uses strictly necessary cookies for authentication and cookieless tracking for analytics. 
          By continuing, you agree to our <Link to="/privacy" className="text-accent-teal hover:underline font-bold" onClick={handleDismiss}>Privacy Policy</Link>.
        </div>
        <button 
          onClick={handleDismiss}
          className="absolute top-4 right-4 text-text-muted hover:text-text-primary transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-teal rounded"
          aria-label="Dismiss cookie notice"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
