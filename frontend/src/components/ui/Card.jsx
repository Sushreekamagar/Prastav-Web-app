import { motion } from 'framer-motion'

export default function Card({ children, className = '', hover = true, ...props }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-30px' }}
      whileHover={hover ? { y: -4, boxShadow: '0 20px 40px rgba(22, 101, 52, 0.12)' } : {}}
      transition={{ duration: 0.3 }}
      className={`rounded-2xl bg-white p-6 shadow-md ${className}`}
      {...props}
    >
      {children}
    </motion.div>
  )
}
