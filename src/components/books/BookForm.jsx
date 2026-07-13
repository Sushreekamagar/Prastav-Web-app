import { useForm } from 'react-hook-form'
import Input from '../ui/Input'
import Select from '../ui/Select'
import Textarea from '../ui/Textarea'
import Button from '../ui/Button'
import {
  BOOK_CATEGORIES,
  BOOK_CONDITIONS,
  LISTING_TYPES,
  GRADES,
} from '../../utils/bookConstants'

export default function BookForm({ initialData, onSubmit, loading }) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({ defaultValues: initialData || {} })

  const listingType = watch('listingType')

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <Input
          label="Book Title"
          placeholder="e.g. Engineering Mathematics I"
          error={errors.title?.message}
          {...register('title', { required: 'Title is required' })}
        />
        <Input
          label="Author"
          placeholder="e.g. Dr. Ram Sharma"
          error={errors.author?.message}
          {...register('author', { required: 'Author is required' })}
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Input
          label="ISBN (optional)"
          placeholder="978-9937-1234-01"
          {...register('isbn')}
        />
        <Select
          label="Category"
          options={BOOK_CATEGORIES}
          error={errors.category?.message}
          {...register('category', { required: 'Category is required' })}
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-3">
        <Select
          label="Grade Level"
          options={GRADES}
          error={errors.grade?.message}
          {...register('grade', { required: 'Grade is required' })}
        />
        <Select
          label="Condition"
          options={BOOK_CONDITIONS}
          error={errors.condition?.message}
          {...register('condition', { required: 'Condition is required' })}
        />
        <Select
          label="Listing Type"
          options={LISTING_TYPES}
          error={errors.listingType?.message}
          {...register('listingType', { required: 'Listing type is required' })}
        />
      </div>

      {listingType === 'sell' && (
        <Input
          label="Price (NPR)"
          type="number"
          placeholder="450"
          error={errors.price?.message}
          {...register('price', {
            required: listingType === 'sell' ? 'Price is required for selling' : false,
            min: { value: 1, message: 'Price must be at least Rs. 1' },
          })}
        />
      )}

      <Textarea
        label="Description"
        placeholder="Describe the book condition, edition, and any notes..."
        error={errors.description?.message}
        {...register('description', { required: 'Description is required' })}
      />

      <Input
        label="Keywords (comma-separated)"
        placeholder="calculus, engineering, math"
        hint="Keywords help our recommendation engine match your book with buyers."
        error={errors.keywords?.message}
        {...register('keywords', { required: 'At least one keyword is required' })}
      />

      <div className="flex justify-end gap-3 pt-2">
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving...' : initialData ? 'Update Listing' : 'Create Listing'}
        </Button>
      </div>
    </form>
  )
}
