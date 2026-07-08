import { RECOMMENDATION_FACTORS } from '../../utils/constants'

export default function RecommendationBadge({ factors, score }) {
  if (!factors) return null

  const activeFactors = RECOMMENDATION_FACTORS.filter((f) => factors[f.key])

  return (
    <div className="rounded-2xl border border-prastav-200 bg-prastav-50 p-5">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-prastav-900">Recommendation Match</h4>
        {score != null && (
          <span className="rounded-full bg-prastav-800 px-3 py-1 text-sm font-bold text-white">
            {score}%
          </span>
        )}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {RECOMMENDATION_FACTORS.map((factor) => (
          <span
            key={factor.key}
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              factors[factor.key]
                ? 'bg-prastav-200 text-prastav-800'
                : 'bg-gray-100 text-gray-400 line-through'
            }`}
          >
            {factor.label}
          </span>
        ))}
      </div>
      <p className="mt-3 text-xs text-gray-500">
        {activeFactors.length} of {RECOMMENDATION_FACTORS.length} factors matched
      </p>
    </div>
  )
}
