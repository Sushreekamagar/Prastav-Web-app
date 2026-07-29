import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { HiOutlineChevronDown } from 'react-icons/hi'
import Container from '../ui/Container'
import SectionTitle from '../ui/SectionTitle'
import { FAQ_ITEMS } from '../../utils/constants'

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState(0)

  return (
    <section id="faq" className="bg-white py-20 lg:py-28">
      <Container>
        <SectionTitle
          eyebrow="FAQs"
          title="Frequently Asked Questions"
          subtitle="Everything you need to know about Prastav."
        />

        <div className="mx-auto max-w-3xl space-y-3">
          {FAQ_ITEMS.map((item, index) => {
            const isOpen = openIndex === index
            return (
              <div
                key={item.question}
                className="overflow-hidden rounded-2xl border border-gray-100 bg-prastav-50/50"
              >
                <button
                  type="button"
                  className="flex w-full items-center justify-between px-6 py-5 text-left"
                  onClick={() => setOpenIndex(isOpen ? -1 : index)}
                  aria-expanded={isOpen}
                >
                  <span className="pr-4 font-semibold text-prastav-900">{item.question}</span>
                  <HiOutlineChevronDown
                    className={`h-5 w-5 shrink-0 text-prastav-600 transition-transform duration-200 ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <p className="border-t border-gray-100 px-6 py-4 text-sm leading-relaxed text-gray-600">
                        {item.answer}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })}
        </div>
      </Container>
    </section>
  )
}
