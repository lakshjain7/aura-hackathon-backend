import { forwardRef } from 'react'
import { motion } from 'framer-motion'

const variantStyles = {
  primary: {
    background: 'var(--aura-accent)',
    color: 'white',
    border: 'none',
    boxShadow: '0 0 20px var(--aura-accent-glow)',
  },
  secondary: {
    background: 'transparent',
    color: 'var(--text-primary)',
    border: '1px solid var(--aura-border)',
  },
  ghost: {
    background: 'transparent',
    color: 'var(--text-secondary)',
    border: 'none',
  },
  danger: {
    background: 'var(--sev-critical-bg)',
    color: 'var(--sev-critical)',
    border: '1px solid var(--sev-critical-border)',
  },
  success: {
    background: 'var(--sev-low-bg)',
    color: 'var(--sev-low)',
    border: '1px solid var(--sev-low-border)',
  },
}

const sizes = {
  sm: 'h-8 px-3 text-xs rounded-md gap-1.5',
  md: 'h-10 px-4 text-sm rounded-lg gap-2',
  lg: 'h-12 px-6 text-base rounded-lg gap-2',
  xl: 'h-14 px-8 text-base rounded-xl gap-2',
}

const Button = forwardRef(function Button({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  className = '',
  onClick,
  style: extraStyle,
  ...props
}, ref) {
  const baseStyle = variantStyles[variant] || variantStyles.primary
  const mergedStyle = extraStyle ? { ...baseStyle, ...extraStyle } : baseStyle

  return (
    <motion.button
      ref={ref}
      className={`inline-flex items-center justify-center font-medium transition-all cursor-pointer
        ${sizes[size]} ${disabled || loading ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
      style={mergedStyle}
      whileHover={!disabled && !loading ? { scale: 1.02, filter: 'brightness(1.1)' } : {}}
      whileTap={!disabled && !loading ? { scale: 0.98 } : {}}
      onClick={disabled || loading ? undefined : onClick}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="32" strokeLinecap="round" />
        </svg>
      )}
      {children}
    </motion.button>
  )
})

export default Button
