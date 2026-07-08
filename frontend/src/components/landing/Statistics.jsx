import { motion } from 'framer-motion'
import Container from '../ui/Container'
import SectionTitle from '../ui/SectionTitle'
import { STATISTICS } from '../../utils/constants'

export default function Statistics() {
  return (
    <section className="bg-gradient-to-r from-prastav-800 to-prastav-900 py-16 lg:py-20">
      <Container>
        <SectionTitle
          title="Prastav by the Numbers"
          subtitle="Growing every day with students across Nepal."
          className="[&_h2]:text-white [&_p]:text-prastav-100"
        />

        <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
          {STATISTICS.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="rounded-2xl bg-white/10 px-4 py-8 text-center backdrop-blur-sm"
            >
              <p className="text-3xl font-bold text-white sm:text-4xl">{stat.value}</p>
              <p className="mt-2 text-sm font-medium text-prastav-100">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </Container>
    </section>
  )
}
