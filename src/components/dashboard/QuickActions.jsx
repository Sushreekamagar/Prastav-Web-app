import Button from '../ui/Button'

export default function QuickActions({ actions = [] }) {
  if (!actions.length) return null

  return (
    <div className="rounded-2xl bg-white p-6 shadow-md">
      <h3 className="font-semibold text-gray-900">Quick Actions</h3>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {actions.map((action) => (
          <Button
            key={action.label}
            to={action.to}
            variant={action.variant || 'outline'}
            size="sm"
            className="justify-start"
            onClick={action.onClick}
          >
            {action.icon && <action.icon className="h-4 w-4" />}
            {action.label}
          </Button>
        ))}
      </div>
    </div>
  )
}
