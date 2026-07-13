import { useMemo, useState } from 'react'
import { HiOutlineSearch } from 'react-icons/hi'
import Input from './Input'
import Select from './Select'
import Badge from './Badge'
import Pagination from './Pagination'
import EmptyState from './EmptyState'

export default function DataTable({
  columns,
  data,
  searchPlaceholder = 'Search...',
  searchKeys = [],
  filters = [],
  statusKey,
  statusMap = {},
  pageSize = 10,
  onView,
  onEdit,
  onDelete,
  emptyTitle = 'No records found',
  emptyDescription,
  emptyActionLabel,
  emptyActionTo,
}) {
  const [search, setSearch] = useState('')
  const [filterValues, setFilterValues] = useState({})
  const [page, setPage] = useState(1)

  const filtered = useMemo(() => {
    let rows = [...data]

    if (search.trim() && searchKeys.length) {
      const q = search.toLowerCase()
      rows = rows.filter((row) =>
        searchKeys.some((key) => {
          const val = key.split('.').reduce((obj, k) => obj?.[k], row)
          return String(val ?? '').toLowerCase().includes(q)
        }),
      )
    }

    filters.forEach((filter) => {
      const val = filterValues[filter.key]
      if (val && val !== 'all') {
        rows = rows.filter((row) => {
          const rowVal = filter.key.split('.').reduce((obj, k) => obj?.[k], row)
          return String(rowVal) === val
        })
      }
    })

    return rows
  }, [data, search, searchKeys, filters, filterValues])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize)

  if (data.length === 0) {
    return (
      <EmptyState
        title={emptyTitle}
        description={emptyDescription}
        actionLabel={emptyActionLabel}
        actionTo={emptyActionTo}
      />
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <Input
            placeholder={searchPlaceholder}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            icon={HiOutlineSearch}
          />
        </div>
        {filters.map((filter) => (
          <div key={filter.key} className="w-full sm:w-44">
            <Select
              label={filter.label}
              options={[{ value: 'all', label: 'All' }, ...filter.options]}
              value={filterValues[filter.key] || 'all'}
              onChange={(e) => {
                setFilterValues((prev) => ({ ...prev, [filter.key]: e.target.value }))
                setPage(1)
              }}
            />
          </div>
        ))}
      </div>

      <div className="overflow-x-auto rounded-2xl bg-white shadow-md">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-prastav-50/50">
              {columns.map((col) => (
                <th key={col.key} className="px-4 py-3 font-semibold text-gray-700">
                  {col.label}
                </th>
              ))}
              {(onView || onEdit || onDelete) && (
                <th className="px-4 py-3 font-semibold text-gray-700">Actions</th>
              )}
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 1} className="px-4 py-8 text-center text-gray-500">
                  No matching records.
                </td>
              </tr>
            ) : (
              paginated.map((row) => (
                <tr key={row._id || row.id} className="border-b border-gray-50 transition-colors hover:bg-gray-50/80">
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-3 text-gray-700">
                      {col.render ? col.render(row) : row[col.key]}
                    </td>
                  ))}
                  {(onView || onEdit || onDelete) && (
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        {statusKey && statusMap[row[statusKey]] && (
                          <Badge variant={statusMap[row[statusKey]].variant}>
                            {statusMap[row[statusKey]].label}
                          </Badge>
                        )}
                        {onView && (
                          <button
                            type="button"
                            onClick={() => onView(row)}
                            className="text-sm font-medium text-prastav-700 hover:underline"
                          >
                            View
                          </button>
                        )}
                        {onEdit && (
                          <button
                            type="button"
                            onClick={() => onEdit(row)}
                            className="text-sm font-medium text-gray-600 hover:underline"
                          >
                            Edit
                          </button>
                        )}
                        {onDelete && (
                          <button
                            type="button"
                            onClick={() => onDelete(row)}
                            className="text-sm font-medium text-red-600 hover:underline"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  )
}
