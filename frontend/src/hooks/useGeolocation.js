import { useState, useEffect, useCallback } from 'react'

// Default to Kathmandu centre — shown immediately while GPS resolves
const DEFAULT_LOCATION = { lat: 27.7172, lng: 85.324 }

export function useGeolocation() {
  // Start with default so the page renders instantly
  const [location, setLocation] = useState(DEFAULT_LOCATION)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.')
      return
    }

    setLoading(true)
    setError(null)

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        })
        setLoading(false)
      },
      (err) => {
        setError(err.message || 'Unable to retrieve your location.')
        // Keep showing default location on error
        setLocation(DEFAULT_LOCATION)
        setLoading(false)
      },
      {
        enableHighAccuracy: false,  // faster — no GPS chip needed
        timeout: 5000,              // 5 s max wait
        maximumAge: 60000,          // reuse a cached fix up to 1 min old
      },
    )
  }, [])

  useEffect(() => {
    requestLocation()
  }, [requestLocation])

  return { location, error, loading, requestLocation }
}
