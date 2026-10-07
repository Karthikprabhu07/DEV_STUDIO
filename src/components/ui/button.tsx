import * as React from "react"
import { cn } from "@/lib/utils"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link" | "glow"
  size?: "default" | "sm" | "lg" | "icon"
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    const variantStyles = {
      default: "bg-[#3B82F6] text-on-accent font-semibold hover:bg-blue-600 active:scale-[0.98] shadow-md shadow-blue-500/25 border border-transparent hover:border-white transition-all",
      glow: "bg-[#3B82F6] text-on-accent font-bold hover:bg-blue-600 hover:shadow-[0_0_20px_rgba(59,130,246,0.45)] active:scale-[0.98] border border-transparent hover:border-white transition-all",
      destructive: "bg-status-destructive text-white font-semibold hover:bg-red-600 active:scale-[0.98] shadow-md shadow-red-500/25 border border-transparent hover:border-white transition-all",
      outline: "border border-border-default bg-transparent text-text-primary hover:bg-white/5 hover:border-slate-500 active:scale-[0.98] transition-all",
      secondary: "bg-slate-800 text-white font-medium hover:bg-slate-700 border border-slate-700/60 active:scale-[0.98] transition-all",
      ghost: "bg-transparent text-text-muted hover:text-white hover:bg-white/10 active:scale-[0.98] transition-all",
      link: "text-[#3B82F6] underline-offset-4 hover:underline font-semibold",
    }

    const sizeStyles = {
      default: "h-10 px-4 py-2 text-sm",
      sm: "h-8 rounded-md px-3 text-xs",
      lg: "h-12 rounded-md px-8 text-base",
      icon: "h-10 w-10 p-0 flex items-center justify-center",
    }

    return (
      <button
        className={cn(
          "inline-flex items-center justify-center rounded-lg font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg-page disabled:pointer-events-none disabled:opacity-50 select-none",
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
