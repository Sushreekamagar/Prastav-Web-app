import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { HiOutlineX } from 'react-icons/hi'

export default function Modal({ isOpen, onClose, title, children, footer, size = 'md' }) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className={`relative flex flex-col w-full rounded-2xl bg-white shadow-2xl ${sizeClasses[size]}`}
            style={{ maxHeight: '90vh' }}
          >
            {/* Header — always visible */}
            <div className="flex flex-shrink-0 items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
              {title && <h2 className="text-xl font-bold text-gray-900">{title}</h2>}
              <button
                type="button"
                onClick={onClose}
                className="ml-auto rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                aria-label="Close modal"
              >
                <HiOutlineX className="h-5 w-5" />
              </button>
            </div>
            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {children}
            </div>
            {/* Sticky footer — always visible */}
            {footer && (
              <div className="flex flex-shrink-0 items-center justify-end gap-3 border-t border-gray-100 px-6 py-4 bg-white">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
