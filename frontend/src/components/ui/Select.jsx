import { forwardRef } from 'react'

const Select = forwardRef(function Select(
  { label, error, options = [], placeholder = 'Select...', className = '', id, ...props },
  ref,
) {
  const selectId = id || props.name

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label htmlFor={selectId} className="mb-1.5 block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <select
        ref={ref}
        id={selectId}
        className={`w-full rounded-xl border bg-white px-4 py-3 text-gray-900 transition-colors focus:border-prastav-500 focus:outline-none focus:ring-2 focus:ring-prastav-500/20 disabled:cursor-not-allowed disabled:bg-gray-50 ${
          error ? 'border-red-400' : 'border-gray-200'
        }`}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="mt-1.5 text-sm text-red-500">{error}</p>}
    </div>
  )
})

export default Select
