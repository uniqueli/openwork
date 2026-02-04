import * as React from "react"
import { cn } from "@/lib/utils"

export interface SwitchProps extends Omit<React.HTMLAttributes<HTMLButtonElement>, "onChange"> {
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
  disabled?: boolean
}

function Switch({ checked = false, onCheckedChange, disabled = false, className, onClick, ...props }: SwitchProps) {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    // Call external onClick first (e.g., for stopPropagation)
    onClick?.(e)
    
    if (!disabled) {
      onCheckedChange?.(!checked)
    }
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={handleClick}
      className={cn(
        "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-white/20 focus:ring-offset-2 focus:ring-offset-[#0D0D0F] disabled:cursor-not-allowed disabled:opacity-50",
        checked ? "bg-blue-500" : "bg-white/10",
        className
      )}
      {...props}
    >
      <span
        className={cn(
          "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
          checked ? "translate-x-4" : "translate-x-0"
        )}
      />
    </button>
  )
}

export { Switch }
