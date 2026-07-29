import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Container from '../ui/Container'
import Logo from '../ui/Logo'
import Button from '../ui/Button'

const slides = [
  {
    id: 1,
    title: 'Student Book Exchange & Recommendations',
    subtitle: 'Your trusted marketplace for academic books in Nepal.',
  },
  {
    id: 2,
    title: 'Buy, Sell & Exchange Locally',
    subtitle: 'Connect with students within 5 KM of your location.',
  },
  {
    id: 3,
    title: 'Smart Hybrid Recommendations',
    subtitle: 'Find the perfect book matched to your grade and interests.',
  },
]

export default function Hero() {
  const [activeSlide, setActiveSlide] = useState(0)

  return (
    <section className="relative overflow-hidden bg-prastav-50 pb-16 pt-12 lg:pb-24 lg:pt-16">
      <Container>
        <div className="flex flex-col items-center text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
          >
            <Logo size="xl" showTagline />
          </motion.div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeSlide}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4 }}
              className="mt-8 max-w-xl"
            >
              <p className="text-lg text-gray-600">{slides[activeSlide].subtitle}</p>
            </motion.div>
          </AnimatePresence>

          <div className="mt-6 flex gap-2">
            {slides.map((_, index) => (
              <button
                key={slides[index].id}
                type="button"
                aria-label={`Go to slide ${index + 1}`}
                onClick={() => setActiveSlide(index)}
                className={`h-2.5 rounded-full transition-all duration-300 ${
                  activeSlide === index ? 'w-8 bg-gray-400' : 'w-2.5 bg-gray-300'
                }`}
              />
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="mt-12 w-full max-w-4xl"
          >
            <div className="rounded-[2rem] bg-gradient-to-r from-lime-300 via-prastav-500 to-prastav-800 px-6 py-12 shadow-xl sm:px-12 sm:py-16">
              <h1 className="text-2xl font-bold text-prastav-900 sm:text-3xl lg:text-4xl">
                Ready to Start Your Book Journey?
              </h1>
              <p className="mx-auto mt-4 max-w-2xl text-base text-prastav-900/80 sm:text-lg">
                Join thousands of readers in Nepal who are already buying, selling, and sharing
                their favorite stories locally.
              </p>
              <div className="mt-8">
                <Button to="/signup" variant="secondary" size="lg">
                  Join Free Now
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </Container>
    </section>
  )
}
