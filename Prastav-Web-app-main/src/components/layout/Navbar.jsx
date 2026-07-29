import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { HiOutlineMenu, HiOutlineX, HiOutlineUserCircle } from 'react-icons/hi'
import { motion, AnimatePresence } from 'framer-motion'
import Container from '../ui/Container'
import Button from '../ui/Button'
import { NAV_LINKS, APP_NAME } from '../../utils/constants'
import { useAuth } from '../../context/AuthContext'

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const { isAuthenticated, user, logout } = useAuth()
  const navigate = useNavigate()

  return (
    <header className="sticky top-0 z-50 bg-prastav-50/95 backdrop-blur-md">
      <Container>
        <nav className="flex h-16 items-center justify-between lg:h-20">
          <Link to="/" className="text-2xl font-bold text-prastav-800">
            {APP_NAME}
          </Link>

          <div className="hidden items-center gap-8 md:flex">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-prastav-800 transition-colors hover:text-prastav-600"
              >
                {link.label}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="hidden items-center gap-1.5 rounded-full bg-prastav-100 px-4 py-2 text-sm font-medium text-prastav-800 transition-colors hover:bg-prastav-200 focus:outline-none sm:flex cursor-pointer"
                >
                  <HiOutlineUserCircle className="h-5 w-5" />
                  {user?.name?.split(' ')[0] || 'Dashboard'}
                  <svg className={`h-4 w-4 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {dropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setDropdownOpen(false)} />
                    <div className="absolute right-0 mt-2 w-48 rounded-xl border border-gray-100 bg-white py-1 shadow-lg z-20">
                      <Link
                        to="/dashboard"
                        onClick={() => setDropdownOpen(false)}
                        className="block px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-prastav-800"
                      >
                        Go to Dashboard
                      </Link>
                      <button
                        type="button"
                        onClick={() => {
                          setDropdownOpen(false)
                          logout()
                          navigate('/')
                        }}
                        className="block w-full text-left px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 cursor-pointer"
                      >
                        Logout
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <>
                <Link
                  to="/login"
                  className="hidden text-sm font-medium text-prastav-800 transition-colors hover:text-prastav-600 sm:block"
                >
                  Login
                </Link>
                <Button to="/signup" size="sm" className="hidden sm:inline-flex">
                  Sign Up
                </Button>
              </>
            )}

            <button
              type="button"
              className="rounded-lg p-2 text-prastav-800 md:hidden"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? (
                <HiOutlineX className="h-6 w-6" />
              ) : (
                <HiOutlineMenu className="h-6 w-6" />
              )}
            </button>
          </div>
        </nav>
      </Container>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-prastav-100 bg-prastav-50 md:hidden"
          >
            <Container className="py-4">
              <div className="flex flex-col gap-3">
                {NAV_LINKS.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    className="rounded-lg px-3 py-2 font-medium text-prastav-800 hover:bg-prastav-100"
                    onClick={() => setMobileOpen(false)}
                  >
                    {link.label}
                  </a>
                ))}
                {isAuthenticated ? (
                  <>
                    <Link
                      to="/dashboard"
                      className="rounded-lg px-3 py-2 font-medium text-prastav-800 hover:bg-prastav-100"
                      onClick={() => setMobileOpen(false)}
                    >
                      Dashboard
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        setMobileOpen(false)
                        logout()
                        navigate('/')
                      }}
                      className="rounded-lg px-3 py-2 text-left font-medium text-red-600 hover:bg-red-50 cursor-pointer"
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      to="/login"
                      className="rounded-lg px-3 py-2 font-medium text-prastav-800 hover:bg-prastav-100"
                      onClick={() => setMobileOpen(false)}
                    >
                      Login
                    </Link>
                    <Link
                      to="/signup"
                      className="rounded-lg px-3 py-2 font-medium text-prastav-800 hover:bg-prastav-100"
                      onClick={() => setMobileOpen(false)}
                    >
                      Sign Up
                    </Link>
                  </>
                )}
              </div>
            </Container>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}

