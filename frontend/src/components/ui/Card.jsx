import { motion } from 'framer-motion'

export default function Card({
  children,
  className = '',
  hover = false,
  accentBorder = null,
  onClick,
  style = {},
  ...props
}) {
  return (
    <motion.div
      className={`rounded-xl ${onClick ? 'cursor-pointer' : ''} ${className}`}
      style={{
        background: 'var(--aura-bg-surface)',
        border: '1px solid var(--aura-border)',
        ...style,
      }}
      whileHover={hover ? {
        y: -2,
        borderColor: 'var(--aura-border-hover)',
        boxShadow: accentBorder ? `0 4px 20px ${accentBorder}20` : '0 4px 20px rgba(0,0,0,0.3)',
      } : {}}
      transition={{ duration: 0.15 }}
      onClick={onClick}
      {...props}
    >
      {accentBorder && (
        <div
          className="h-[3px] rounded-t-xl"
          style={{ background: accentBorder }}
        />
      )}
      {children}
    </motion.div>
  )
}
