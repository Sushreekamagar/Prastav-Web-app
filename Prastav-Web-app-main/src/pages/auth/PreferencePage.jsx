import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { motion, AnimatePresence } from 'framer-motion'
import {
  HiOutlineBookOpen,
  HiOutlineTag,
  HiOutlineLightningBolt,
  HiScale,
  HiOutlineLocationMarker,
} from 'react-icons/hi'
import Button from '../../components/ui/Button'
import Select from '../../components/ui/Select'
import { useAuth } from '../../context/AuthContext'
import { updateProfile, updateLocation } from '../../services/authService'
import { GRADES, NEPAL_DISTRICTS } from '../../utils/bookConstants'

/* ─── constants ─────────────────────────────────────── */
const SUBJECT_OPTIONS = [
  'Science', 'Mathematics', 'Computer Science', 'Economics', 'Social Studies'
]

const BOOK_TYPES = [
  { value: 'school', label: 'School Textbooks' },
  { value: 'college', label: 'College / University Books' },
  { value: 'notes', label: 'Handwritten Notes' },
]

const PRICING_STRATEGIES = [
  {
    value: 'fast',
    label: 'Fast Sale',
    desc: 'Lowest price for quick turnover',
    icon: HiOutlineLightningBolt,
  },
  {
    value: 'balanced',
    label: 'Balanced',
    desc: 'Fair market value',
    icon: HiScale,
  },
]

const DELIVERY_OPTIONS = [
  { value: 'self_pickup', label: 'Self Pickup / Meetup in Public Place' },
  { value: 'courier', label: 'Home Delivery (Courier)' },
]

/* ─── Role Card ─────────────────────────────────────── */
function RoleCard({ icon, label, selected, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 text-center transition-all duration-200 focus:outline-none ${
        selected
          ? 'border-prastav-600 bg-prastav-100/50'
          : 'border-gray-100 bg-gray-50/50 hover:bg-gray-100'
      }`}
    >
      <span className="text-2xl">{icon}</span>
      <span className={`text-sm font-bold ${selected ? 'text-prastav-800' : 'text-gray-600'}`}>
        {label}
      </span>
    </button>
  )
}

/* ─── Chip Group ────────────────────────────────────── */
function ChipGroup({ options, selected, onToggle, multi = true }) {
  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {options.map((opt) => {
        const active = multi ? selected.includes(opt) : selected === opt
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onToggle(opt)}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${
              active
                ? 'bg-prastav-700 text-white'
                : 'bg-prastav-50 text-prastav-700 hover:bg-prastav-100'
            }`}
          >
            {opt}
          </button>
        )
      })}
    </div>
  )
}

/* ─── Custom Radio ──────────────────────────────────── */
function CustomRadio({ label, options, value, onChange }) {
  return (
    <div className="mt-2 flex flex-wrap gap-6">
      {options.map((opt) => (
        <label key={opt.value} className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
          <div className={`flex h-4 w-4 items-center justify-center rounded-full border-2 ${value === opt.value ? 'border-prastav-600' : 'border-gray-300'}`}>
            {value === opt.value && <div className="h-2 w-2 rounded-full bg-prastav-600" />}
          </div>
          <input
            type="radio"
            className="hidden"
            checked={value === opt.value}
            onChange={() => onChange(opt.value)}
          />
          {opt.label}
        </label>
      ))}
    </div>
  )
}

/* ─── Range Slider (Visual only for now) ────────────── */
function FakeRangeSlider() {
  return (
    <div className="mt-2">
      <div className="flex justify-end mb-1">
        <span className="text-xs font-bold text-prastav-600">NPR 100 - NPR 2000</span>
      </div>
      <div className="relative h-2 w-full rounded-full bg-prastav-100">
        <div className="absolute left-[10%] right-[30%] h-full rounded-full bg-prastav-600" />
        <div className="absolute left-[10%] top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-prastav-600 shadow" />
        <div className="absolute right-[30%] top-1/2 h-4 w-4 translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-prastav-600 shadow" />
      </div>
    </div>
  )
}

/* ─── Buyer Preferences ─────────────────────────────── */
function BuyerPreferences({ prefs, onChange }) {
  const toggleSubject = (val) => {
    const cur = prefs.subjects || []
    onChange('subjects', cur.includes(val) ? cur.filter(v => v !== val) : [...cur, val])
  }

  const toggleDelivery = (val) => {
    const cur = prefs.deliveryOptions || []
    onChange('deliveryOptions', cur.includes(val) ? cur.filter(v => v !== val) : [...cur, val])
  }

  return (
    <div className="mt-8 space-y-6">
      <div className="flex items-center gap-2 text-prastav-700">
        <HiOutlineBookOpen className="h-6 w-6" />
        <h3 className="text-lg font-bold">Buyer Preferences</h3>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <label className="text-xs font-bold text-gray-700">Grade Level</label>
          <div className="mt-2">
            <Select
              options={[{ value: '1-5', label: 'Grade 1-5' }, ...GRADES]}
              value={prefs.grade || '1-5'}
              onChange={(e) => onChange('grade', e.target.value)}
              className="bg-white border-gray-200"
            />
          </div>
        </div>
      </div>

      <div>
        <label className="text-xs font-bold text-gray-700">Interested Subjects</label>
        <ChipGroup
          options={SUBJECT_OPTIONS}
          selected={prefs.subjects || []}
          onToggle={toggleSubject}
          multi={true}
        />
      </div>

      <div>
        <label className="text-xs font-bold text-gray-700">Preferred Condition</label>
        <CustomRadio
          options={[
            { value: 'like_new', label: 'Like New (No marks)' },
            { value: 'good', label: 'Good (Minimal marks)' },
            { value: 'fair', label: 'Fair (Heavily used)' },
          ]}
          value={prefs.condition || 'good'}
          onChange={(v) => onChange('condition', v)}
        />
      </div>

      <div>
        <label className="text-xs font-bold text-gray-700">Preferred Delivery Mode</label>
        <div className="mt-3 flex flex-wrap gap-3">
          {DELIVERY_OPTIONS.map(opt => {
            const selected = (prefs.deliveryOptions || []).includes(opt.value)
            return (
              <label key={opt.value} className={`flex items-center gap-2 rounded-lg px-4 py-2 cursor-pointer transition-colors ${
                selected ? 'bg-prastav-100' : 'bg-gray-100 hover:bg-gray-200'
              }`}>
                <div className={`flex h-4 w-4 items-center justify-center rounded border ${
                  selected ? 'bg-prastav-600 border-prastav-600' : 'bg-white border-gray-300'
                }`}>
                  {selected && (
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <input type="checkbox" className="hidden" checked={selected} onChange={() => toggleDelivery(opt.value)} />
                <span className={`text-xs font-medium ${selected ? 'text-prastav-800' : 'text-gray-600'}`}>{opt.label}</span>
              </label>
            )
          })}
        </div>
      </div>

    </div>
  )
}

/* ─── Seller Preferences ────────────────────────────── */
function SellerPreferences({
  prefs,
  onChange,
  district,
  setDistrict,
  latitude,
  setLatitude,
  longitude,
  setLongitude,
  geoLoading,
  handleDetectLocation,
}) {
  const toggleBookType = (val) => {
    const cur = prefs.bookTypes || []
    onChange('bookTypes', cur.includes(val) ? cur.filter(v => v !== val) : [...cur, val])
  }

  return (
    <div className="mt-8 space-y-6">
      <div className="flex items-center gap-2 text-prastav-700">
        <HiOutlineTag className="h-6 w-6" />
        <h3 className="text-lg font-bold">Seller Preferences</h3>
      </div>

      <div>
        <label className="text-xs font-bold text-gray-700">What type of books do you sell?</label>
        <div className="mt-3 rounded-xl border border-gray-100 bg-gray-50/50 p-3 space-y-0">
          {/* Select All */}
          {(() => {
            const bookTypes = prefs.bookTypes || []
            const allSelected = BOOK_TYPES.every(bt => bookTypes.includes(bt.value))
            const someSelected = BOOK_TYPES.some(bt => bookTypes.includes(bt.value)) && !allSelected
            return (
              <label className="flex items-center gap-3 text-sm font-bold text-prastav-800 cursor-pointer py-2.5 px-1 border-b border-gray-200 mb-1 hover:bg-prastav-50/50 rounded-lg transition-colors select-none">
                <div
                  className={`flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border-2 transition-colors ${
                    allSelected
                      ? 'bg-prastav-600 border-prastav-600'
                      : someSelected
                      ? 'bg-prastav-200 border-prastav-400'
                      : 'border-gray-300 bg-white'
                  }`}
                >
                  {allSelected ? (
                    <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : someSelected ? (
                    <div className="w-2 h-0.5 bg-prastav-600 rounded-full" />
                  ) : null}
                </div>
                <input
                  type="checkbox"
                  className="hidden"
                  checked={allSelected}
                  onChange={() => onChange('bookTypes', allSelected ? [] : BOOK_TYPES.map(bt => bt.value))}
                />
                Select All
              </label>
            )
          })()}

          {BOOK_TYPES.map(bt => {
            const isChecked = (prefs.bookTypes || []).includes(bt.value)
            return (
              <label key={bt.value} className="flex items-center gap-3 text-sm text-gray-700 cursor-pointer py-2.5 px-1 hover:bg-prastav-50/50 rounded-lg transition-colors select-none">
                <div className={`flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border-2 transition-colors ${
                  isChecked ? 'bg-prastav-600 border-prastav-600' : 'border-gray-300 bg-white'
                }`}>
                  {isChecked && (
                    <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <input type="checkbox" className="hidden" checked={isChecked} onChange={() => toggleBookType(bt.value)} />
                {bt.label}
              </label>
            )
          })}
        </div>
      </div>

      {/* Location Section */}
      <div className="border-t border-gray-100 pt-6 space-y-4">
        <div className="flex items-center gap-2 text-prastav-700">
          <HiOutlineLocationMarker className="h-5 w-5" />
          <h4 className="font-bold text-sm">Seller Location (for distance calculation)</h4>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="text-xs font-bold text-gray-700">Select District</label>
            <div className="mt-2">
              <Select
                options={NEPAL_DISTRICTS.map((d) => ({ value: d, label: d }))}
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="bg-white border-gray-200"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-700">GPS Coordinates</label>
            <div className="mt-2 flex flex-col gap-2">
              <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-600 font-mono">
                {latitude && longitude && (latitude !== 0 || longitude !== 0) ? (
                  <span>Lat: {latitude.toFixed(5)}, Lng: {longitude.toFixed(5)}</span>
                ) : (
                  <span className="text-gray-400 italic">No GPS coordinates set yet</span>
                )}
              </div>
              <button
                type="button"
                onClick={handleDetectLocation}
                disabled={geoLoading}
                className="flex items-center justify-center gap-1.5 rounded-lg border border-prastav-200 bg-prastav-50 px-3 py-1.5 text-xs font-semibold text-prastav-700 hover:bg-prastav-100 transition-colors disabled:opacity-50"
              >
                {geoLoading ? (
                  <>
                    <svg className="animate-spin h-3.5 w-3.5 text-prastav-700" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Detecting...
                  </>
                ) : (
                  <>🎯 Detect Current Location</>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════════════ */
export default function PreferencePage() {
  const { user, updateUser, logout } = useAuth()
  const navigate = useNavigate()

  const [role, setRole] = useState(user?.role || 'both')
  const [loading, setLoading] = useState(false)
  const [district, setDistrict] = useState(user?.district || 'Kathmandu')
  const [latitude, setLatitude] = useState(user?.location?.coordinates?.[1] || 0)
  const [longitude, setLongitude] = useState(user?.location?.coordinates?.[0] || 0)
  const [geoLoading, setGeoLoading] = useState(false)

  const [buyerPrefs, setBuyerPrefs] = useState({
    grade: user?.grade || '1-5',
    preferredLanguage: 'English',
    subjects: ['Science', 'Computer Science'],
    condition: 'good',
    budgetMin: 100,
    budgetMax: 2000,
    deliveryOptions: ['self_pickup'],
  })

  const [sellerPrefs, setSellerPrefs] = useState({
    bookTypes: [],
    pricingStrategy: 'fast',
  })

  const handleBuyerChange = (key, val) => setBuyerPrefs(p => ({ ...p, [key]: val }))
  const handleSellerChange = (key, val) => setSellerPrefs(p => ({ ...p, [key]: val }))

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser')
      return
    }
    setGeoLoading(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude)
        setLongitude(position.coords.longitude)
        toast.success('GPS coordinates detected! 📍')
        setGeoLoading(false)
      },
      (err) => {
        toast.error(`Error finding location: ${err.message}. Please allow location access.`)
        setGeoLoading(false)
      }
    )
  }

  const handleBackToDashboard = async () => {
    if (!user?.preferencesSet) {
      setLoading(true)
      try {
        const payload = {
          role: user?.role || 'both',
          district: user?.district || 'Kathmandu',
          preferencesSet: true,
        }
        const updated = await updateProfile(payload)
        updateUser(updated)
      } catch (err) {
        // ignore
      } finally {
        setLoading(false)
      }
    }
    navigate('/dashboard')
  }

  const handleSubmit = async () => {
    setLoading(true)
    try {
      const payload = {
        role,
        district,
        ...(role !== 'seller' ? { preferences: buyerPrefs } : {}),
        ...(role !== 'buyer' ? { sellerPreferences: sellerPrefs } : {}),
        preferencesSet: true,
      }
      const updated = await updateProfile(payload)
      
      let finalUser = updated
      if (latitude !== 0 || longitude !== 0) {
        finalUser = await updateLocation({ latitude, longitude })
      }
      
      updateUser(finalUser)
      toast.success('Preferences saved! 🎉')
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.message || 'Failed to save preferences')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F3FDF5]">
      {/* Top bar */}
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <div className="text-xl font-bold text-prastav-700">Prastav</div>
        <div className="flex gap-2">
          <button
            onClick={handleBackToDashboard}
            className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 shadow-sm transition-all hover:border-prastav-300 hover:text-prastav-700"
          >
            ← Back to Dashboard
          </button>
          {!user?.preferencesSet && (
            <button
              onClick={() => { logout(); navigate('/signup') }}
              className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 shadow-sm transition-all hover:border-prastav-300 hover:text-prastav-700"
            >
              ← Back to Signup
            </button>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-4 py-6">
        {/* Main Card */}
        <div className="rounded-2xl bg-white p-8 shadow-sm">
          
          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex justify-between text-xs font-bold text-prastav-600 mb-2">
              <span>Step 2 of 2 - Set Your Preferences</span>
              <span>100%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-prastav-100">
              <div className="h-full rounded-full bg-prastav-700 w-full" />
            </div>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-6">What do you want to do?</h2>

          {/* Role Selection */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <RoleCard icon="📚" label="I want to BUY books" selected={role === 'buyer'} onClick={() => setRole('buyer')} />
            <RoleCard icon="💰" label="I want to SELL books" selected={role === 'seller'} onClick={() => setRole('seller')} />
            <RoleCard icon="🔄" label="Both" selected={role === 'both'} onClick={() => setRole('both')} />
          </div>

          {/* Conditional Preference Sections */}
          <AnimatePresence mode="popLayout">
            {(role === 'buyer' || role === 'both') && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                <BuyerPreferences prefs={buyerPrefs} onChange={handleBuyerChange} />
              </motion.div>
            )}

            {(role === 'seller' || role === 'both') && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                <SellerPreferences
                  prefs={sellerPrefs}
                  onChange={handleSellerChange}
                  district={district}
                  setDistrict={setDistrict}
                  latitude={latitude}
                  setLatitude={setLatitude}
                  longitude={longitude}
                  setLongitude={setLongitude}
                  geoLoading={geoLoading}
                  handleDetectLocation={handleDetectLocation}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Submit Button */}
          <div className="mt-10">
            <Button onClick={handleSubmit} disabled={loading} className="w-full !rounded-lg !py-3.5 !bg-[#0D723B] hover:!bg-[#0A5D30]">
              {loading ? 'Saving...' : 'Save Preferences & Continue →'}
            </Button>
            <p className="mt-4 text-center text-[10px] text-gray-400">
              You can change these settings anytime in your profile.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-12 bg-white py-6 border-t border-gray-100">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6">
          <div>
            <div className="text-lg font-bold text-prastav-700">BookSwap</div>
            <p className="text-[10px] text-gray-400 mt-1">© 2024 BookSwap Marketplace. All rights reserved.</p>
          </div>
          <div className="flex gap-4 text-[10px] font-medium text-gray-500">
            <a href="#" className="hover:text-gray-800">Privacy Policy</a>
            <a href="#" className="hover:text-gray-800">Terms of Service</a>
            <a href="#" className="hover:text-gray-800">Help Center</a>
          </div>
        </div>
      </div>
    </div>
  )
}
