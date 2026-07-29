import { forwardRef } from 'react'

const Input = forwardRef(function Input(
  { label, error, hint, icon: Icon, className = '', id, ...props },
  ref,
) {
  const inputId = id || props.name

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <Icon className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
        )}
        <input
          ref={ref}
          id={inputId}
          className={`w-full rounded-xl border bg-white px-4 py-3 text-gray-900 transition-colors placeholder:text-gray-400 focus:border-prastav-500 focus:outline-none focus:ring-2 focus:ring-prastav-500/20 disabled:cursor-not-allowed disabled:bg-gray-50 ${
            Icon ? 'pl-10' : ''
          } ${error ? 'border-red-400' : 'border-gray-200'}`}
          {...props}
        />
      </div>
      {error && <p className="mt-1.5 text-sm text-red-500">{error}</p>}
      {hint && !error && <p className="mt-1.5 text-sm text-gray-500">{hint}</p>}
    </div>
  )
})

export default Input
