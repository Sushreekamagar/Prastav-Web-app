export default function Spinner({ size = 'md', className = '' }) {
  const sizes = {
    sm: 'h-5 w-5 border-2',
    md: 'h-8 w-8 border-[3px]',
    lg: 'h-12 w-12 border-4',
  }

  return (
    <div
      className={`animate-spin rounded-full border-prastav-200 border-t-prastav-600 ${sizes[size]} ${className}`}
      role="status"
      aria-label="Loading"
    />
  )
}

export function LoadingScreen({ message = 'Loading...' }) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4">
      <Spinner size="lg" />
      <p className="text-sm text-gray-500">{message}</p>
    </div>
  )
}
