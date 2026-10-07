import React from 'react'
import { Terminal, Home, LogIn } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'

interface NotFoundPageProps {
  onOpenAuth: () => void
}

export const NotFoundPage: React.FC<NotFoundPageProps> = ({ onOpenAuth }) => {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-4">
      <div className="w-24 h-24 rounded-2xl bg-bg-surface border border-border-default flex items-center justify-center text-accent-teal shadow-2xl mb-8">
        <Terminal className="w-12 h-12" />
      </div>
      
      <h1 className="text-6xl md:text-8xl font-black font-sans tracking-tighter text-text-primary mb-4 drop-shadow-sm">404</h1>
      
      <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-status-destructive/10 border border-status-destructive/20 text-xs font-mono font-bold uppercase tracking-wider text-status-destructive mb-6 shadow-sm">
        <span>Path Not Found</span>
      </div>
      
      <p className="text-sm md:text-base text-text-muted text-center max-w-md leading-relaxed font-medium mb-10">
        The route you are looking for does not exist, or you might need to sign in to access it.
      </p>
      
      <div className="flex flex-col sm:flex-row items-center gap-4">
        <Link to="/">
          <Button variant="outline" className="gap-2 text-xs font-mono w-full sm:w-auto h-11 px-6 rounded-xl border-border-default hover:bg-bg-surface hover:text-text-primary transition-all">
            <Home className="w-4 h-4" />
            <span>Go Home</span>
          </Button>
        </Link>
        <Button 
          variant="default" 
          onClick={onOpenAuth}
          className="gap-2 text-xs font-mono w-full sm:w-auto h-11 px-6 rounded-xl bg-accent-teal hover:bg-accent-teal/90 text-on-accent font-bold shadow-md shadow-accent-teal/20 transition-all"
        >
          <LogIn className="w-4 h-4" />
          <span>Sign In</span>
        </Button>
      </div>
    </div>
  )
}
