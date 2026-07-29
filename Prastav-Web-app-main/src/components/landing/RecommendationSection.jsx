import { HiOutlineCheckCircle } from 'react-icons/hi'
import { motion } from 'framer-motion'
import Container from '../ui/Container'
import SectionTitle from '../ui/SectionTitle'
import { RECOMMENDATION_FACTORS } from '../../utils/constants'

export default function RecommendationSection() {
  return (
    <section id="recommendations" className="bg-white py-20 lg:py-28">
      <Container>
        <SectionTitle
          eyebrow="Innovation"
          title="How Recommendation Works"
          subtitle="Our hybrid recommendation engine combines five intelligent factors to surface the most relevant books for you."
        />

        <div className="grid items-center gap-12 lg:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="rounded-3xl bg-gradient-to-br from-prastav-50 to-prastav-100 p-8 shadow-md lg:p-10"
          >
            <h3 className="text-xl font-bold text-prastav-900">Why Recommended?</h3>
            <p className="mt-2 text-gray-600">
              Each recommendation comes with a transparent explanation of why it was matched to you.
            </p>

            <ul className="mt-8 space-y-4">
              {RECOMMENDATION_FACTORS.map((factor, index) => (
                <motion.li
                  key={factor.key}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center gap-3"
                >
                  <HiOutlineCheckCircle className="h-6 w-6 shrink-0 text-prastav-600" />
                  <span className="font-medium text-prastav-800">{factor.label}</span>
                </motion.li>
              ))}
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="relative"
          >
            <div className="rounded-3xl border border-prastav-100 bg-white p-6 shadow-lg">
              <div className="mb-4 flex items-center gap-2">
                <span className="rounded-full bg-prastav-600 px-3 py-1 text-xs font-semibold text-white">
                  Top Match
                </span>
                <span className="text-sm text-gray-500">Score: 94%</span>
              </div>

              <div className="flex gap-4">
                <div className="h-28 w-20 shrink-0 rounded-xl bg-gradient-to-b from-prastav-200 to-prastav-400" />
                <div>
                  <h4 className="font-bold text-prastav-900">Mathematics Grade 10</h4>
                  <p className="text-sm text-gray-500">Author: Curriculum Development Centre</p>
                  <p className="mt-1 text-sm text-gray-500">Genre: Mathematics · Grade 10</p>
                  <p className="mt-2 text-sm font-medium text-prastav-700">
                    Seller: Anisha K. · 2.3 KM away
                  </p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {RECOMMENDATION_FACTORS.slice(0, 4).map((f) => (
                  <span
                    key={f.key}
                    className="rounded-full bg-prastav-50 px-3 py-1 text-xs font-medium text-prastav-700"
                  >
                    ✓ {f.label}
                  </span>
                ))}
              </div>
            </div>

            <div className="absolute -bottom-4 -right-4 -z-10 h-full w-full rounded-3xl bg-prastav-200/50" />
          </motion.div>
        </div>
      </Container>
    </section>
  )
}
