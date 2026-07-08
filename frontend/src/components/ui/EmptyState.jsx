import Button from './Button'

export default function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionTo,
  onAction,
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50/50 px-6 py-16 text-center">
      {Icon && (
        <div className="mb-4 rounded-full bg-prastav-100 p-4">
          <Icon className="h-8 w-8 text-prastav-600" />
        </div>
      )}
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      {description && <p className="mt-2 max-w-sm text-sm text-gray-500">{description}</p>}
      {(actionLabel && actionTo) || onAction ? (
        <div className="mt-6">
          {actionTo ? (
            <Button to={actionTo} size="sm">
              {actionLabel}
            </Button>
          ) : (
            <Button size="sm" onClick={onAction}>
              {actionLabel}
            </Button>
          )}
        </div>
      ) : null}
    </div>
  )
}
