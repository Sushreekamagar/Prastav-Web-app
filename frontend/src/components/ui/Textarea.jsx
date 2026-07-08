import { forwardRef } from 'react'

const Textarea = forwardRef(function Textarea(
  { label, error, hint, rows = 4, className = '', id, ...props },
  ref,
) {
  const textareaId = id || props.name

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label htmlFor={textareaId} className="mb-1.5 block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        id={textareaId}
        rows={rows}
        className={`w-full resize-y rounded-xl border bg-white px-4 py-3 text-gray-900 transition-colors placeholder:text-gray-400 focus:border-prastav-500 focus:outline-none focus:ring-2 focus:ring-prastav-500/20 disabled:cursor-not-allowed disabled:bg-gray-50 ${
          error ? 'border-red-400' : 'border-gray-200'
        }`}
        {...props}
      />
      {error && <p className="mt-1.5 text-sm text-red-500">{error}</p>}
      {hint && !error && <p className="mt-1.5 text-sm text-gray-500">{hint}</p>}
    </div>
  )
})

export default Textarea
