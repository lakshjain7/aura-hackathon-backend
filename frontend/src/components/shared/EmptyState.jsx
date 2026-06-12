export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      {Icon && (
        <div className="mb-4" style={{ color: 'var(--text-tertiary)' }}>
          <Icon size={24} />
        </div>
      )}
      <h3 className="text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
        {title}
      </h3>
      {description && (
        <p className="text-xs max-w-xs" style={{ color: 'var(--text-tertiary)' }}>
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
