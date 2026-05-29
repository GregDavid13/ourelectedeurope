// Button — shared web primitive. Three variants keyed to the EU
// blue/gold theme. Polymorphic via `as` so it renders either a
// <button> or a Next <Link>-compatible <a> while keeping one style
// source. App-specific composition stays in apps/web/components.
import { forwardRef } from 'react'
import type { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'gold' | 'outline' | 'ghost'
type Size = 'sm' | 'md' | 'lg'

const base =
  'inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-colors ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-eu-gold-400 ' +
  'disabled:opacity-60 disabled:pointer-events-none'

const variants: Record<Variant, string> = {
  primary: 'bg-eu-blue-700 text-white hover:bg-eu-blue-800',
  gold:    'bg-eu-gold-400 text-eu-blue-950 hover:bg-eu-gold-300',
  outline: 'border-2 border-eu-blue-700 text-eu-blue-700 hover:bg-eu-blue-50',
  ghost:   'text-eu-blue-700 hover:bg-eu-blue-50',
}

const sizes: Record<Size, string> = {
  sm: 'h-9 px-3 text-sm',
  md: 'h-11 px-5 text-sm',
  lg: 'h-12 px-7 text-base',
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', className = '', ...props }, ref) => (
    <button
      ref={ref}
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    />
  ),
)
Button.displayName = 'Button'

// Same visual system for links (CTAs that navigate). Kept here so the
// variant/size tokens have a single definition.
export function buttonClasses(variant: Variant = 'primary', size: Size = 'md', className = '') {
  return `${base} ${variants[variant]} ${sizes[size]} ${className}`
}
