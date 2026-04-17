const variants = {
  card: 'h-32 w-full rounded-lg',
  stat: 'h-24 w-full rounded-lg',
  'complaint-card': 'h-28 w-full rounded-lg',
  chart: 'h-64 w-full rounded-lg',
  'text-row': 'h-4 w-3/4 rounded',
}

export default function LoadingSkeleton({ variant = 'card', className = '' }) {
  return (
    <div
      className={`skeleton ${variants[variant] || variants.card} ${className}`}
    />
  )
}
