import { HiOutlineSearch } from 'react-icons/hi'
import Input from '../ui/Input'
import Select from '../ui/Select'
import Button from '../ui/Button'
import { BOOK_CATEGORIES, BOOK_CONDITIONS, LISTING_TYPES, GRADES } from '../../utils/bookConstants'

export default function BookFilters({ filters, onChange, onReset }) {
  const handleChange = (key, value) => {
    onChange({ ...filters, [key]: value })
  }

  return (
    <div className="rounded-2xl bg-white p-5 shadow-md">
      <div className="mb-4">
        <Input
          placeholder="Search by title, author, or keyword..."
          value={filters.search || ''}
          onChange={(e) => handleChange('search', e.target.value)}
          icon={HiOutlineSearch}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Select
          label="Category"
          placeholder="All Categories"
          options={BOOK_CATEGORIES}
          value={filters.category || ''}
          onChange={(e) => handleChange('category', e.target.value)}
        />
        <Select
          label="Listing Type"
          placeholder="All Types"
          options={LISTING_TYPES}
          value={filters.listingType || ''}
          onChange={(e) => handleChange('listingType', e.target.value)}
        />
        <Select
          label="Grade Level"
          placeholder="All Grades"
          options={GRADES}
          value={filters.grade || ''}
          onChange={(e) => handleChange('grade', e.target.value)}
        />
        <Select
          label="Condition"
          placeholder="Any Condition"
          options={BOOK_CONDITIONS}
          value={filters.condition || ''}
          onChange={(e) => handleChange('condition', e.target.value)}
        />
      </div>

      {(filters.search || filters.category || filters.listingType || filters.grade || filters.condition) && (
        <div className="mt-4 flex justify-end">
          <Button variant="ghost" size="sm" onClick={onReset}>
            Clear Filters
          </Button>
        </div>
      )}
    </div>
  )
}
