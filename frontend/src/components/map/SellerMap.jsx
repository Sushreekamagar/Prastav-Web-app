import { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const sellerIcon = new L.DivIcon({
  className: 'custom-marker',
  html: `<div style="background:#166534;width:32px;height:32px;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/></svg>
  </div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
})

const userIcon = new L.DivIcon({
  className: 'custom-marker',
  html: `<div style="background:#2563eb;width:16px;height:16px;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);"></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
})

export default function SellerMap({ sellers = [], userLocation, radiusKm = 5 }) {
  const center = userLocation || { lat: 27.7172, lng: 85.324 }

  useEffect(() => {
    delete L.Icon.Default.prototype._getIconUrl
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    })
  }, [])

  return (
    <div className="overflow-hidden rounded-2xl shadow-md">
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={13}
        className="h-[400px] w-full"
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {userLocation && (
          <>
            <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon}>
              <Popup>You are here</Popup>
            </Marker>
            <Circle
              center={[userLocation.lat, userLocation.lng]}
              radius={radiusKm * 1000}
              pathOptions={{ color: '#22c55e', fillColor: '#22c55e', fillOpacity: 0.08, weight: 2 }}
            />
          </>
        )}

        {sellers.map((seller) =>
          seller.location ? (
            <Marker
              key={seller._id}
              position={[seller.location.lat, seller.location.lng]}
              icon={sellerIcon}
            >
              <Popup>
                <div className="text-sm">
                  <p className="font-semibold">{seller.name}</p>
                  <p className="text-gray-500">{seller.district}</p>
                  {seller.distance != null && <p>{seller.distance} km away</p>}
                  {seller.bookTitle && <p className="mt-1 italic">&ldquo;{seller.bookTitle}&rdquo;</p>}
                </div>
              </Popup>
            </Marker>
          ) : null,
        )}
      </MapContainer>
    </div>
  )
}
