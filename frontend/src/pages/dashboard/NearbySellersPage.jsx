import { useEffect, useState } from 'react'
import { HiOutlineLocationMarker } from 'react-icons/hi'
import { DashboardPage } from '../../layouts/DashboardLayout'
import SellerMap from '../../components/map/SellerMap'
import Avatar from '../../components/ui/Avatar'
import Badge from '../../components/ui/Badge'
import { LoadingScreen } from '../../components/ui/Spinner'
import { useGeolocation } from '../../hooks/useGeolocation'
import { getNearbySellers } from '../../services/bookService'
import Button from '../../components/ui/Button'

export default function NearbySellersPage() {
  const { location, loading: geoLoading, error: geoError, requestLocation } = useGeolocation()
  const [sellers, setSellers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const result = await getNearbySellers({
          lat: location?.lat,
          lng: location?.lng,
          radius: 5,
        })
        setSellers(result.sellers || [])
      } catch {
        setSellers([])
      } finally {
        setLoading(false)
      }
    }
    if (location) load()
  }, [location])

  if (geoLoading || loading) {
    return <LoadingScreen message="Finding nearby sellers..." />
  }

  return (
    <DashboardPage
      title="Nearby Sellers"
      subtitle="Discover book sellers within 5 KM of your location"
    >
      {geoError && (
        <div className="mb-4 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {geoError} Showing default location (Kathmandu).
          <Button variant="ghost" size="sm" onClick={requestLocation} className="ml-2">
            Retry
          </Button>
        </div>
      )}

      <SellerMap sellers={sellers} userLocation={location} radiusKm={5} />

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sellers.map((seller) => (
          <div key={seller._id} className="rounded-2xl bg-white p-5 shadow-md">
            <div className="flex items-center gap-3">
              <Avatar name={seller.name} />
              <div>
                <p className="font-semibold text-gray-900">{seller.name}</p>
                <p className="flex items-center gap-1 text-sm text-gray-500">
                  <HiOutlineLocationMarker className="h-4 w-4" />
                  {seller.district}
                </p>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <Badge variant="primary">{seller.distance} km</Badge>
              <span className="text-sm text-gray-500">★ {seller.reputation}</span>
            </div>
            {seller.bookTitle && (
              <p className="mt-2 text-sm italic text-gray-600">&ldquo;{seller.bookTitle}&rdquo;</p>
            )}
          </div>
        ))}
      </div>
    </DashboardPage>
  )
}
