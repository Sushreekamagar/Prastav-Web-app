import { motion } from 'framer-motion'

export default function SectionTitle({
  eyebrow,
  title,
  subtitle,
  align = 'center',
  className = '',
}) {
  const alignClass =
    align === 'center' ? 'text-center mx-auto' : align === 'left' ? 'text-left' : 'text-right'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.5 }}
      className={`mb-12 max-w-3xl ${alignClass} ${className}`}
    >
      {eyebrow && (
        <span className="mb-3 inline-block rounded-full bg-prastav-100 px-4 py-1 text-sm font-semibold text-prastav-700">
          {eyebrow}
        </span>
      )}
      <h2 className="text-3xl font-bold tracking-tight text-prastav-900 sm:text-4xl">{title}</h2>
      {subtitle && (
        <p className="mt-4 text-lg leading-relaxed text-gray-600">{subtitle}</p>
      )}
    </motion.div>
  )
}
