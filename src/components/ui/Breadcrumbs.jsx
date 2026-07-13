import { Link } from 'react-router-dom'
import { HiOutlineChevronRight } from 'react-icons/hi'

export default function Breadcrumbs({ items = [] }) {
  if (!items.length) return null

  return (
    <nav aria-label="Breadcrumb" className="mb-4 flex flex-wrap items-center gap-1 text-sm">
      {items.map((item, index) => {
        const isLast = index === items.length - 1
        return (
          <span key={item.label} className="flex items-center gap-1">
            {index > 0 && <HiOutlineChevronRight className="h-3.5 w-3.5 text-gray-400" />}
            {isLast || !item.to ? (
              <span className={isLast ? 'font-medium text-prastav-800' : 'text-gray-500'}>
                {item.label}
              </span>
            ) : (
              <Link to={item.to} className="text-gray-500 transition-colors hover:text-prastav-700">
                {item.label}
              </Link>
            )}
          </span>
        )
      })}
    </nav>
  )
}
