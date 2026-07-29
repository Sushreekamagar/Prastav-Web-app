import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'

export default function StatCard({ label, value, icon: Icon, color = 'prastav', to }) {
  const colorClasses = {
    prastav: 'bg-prastav-50 text-prastav-700',
    blue: 'bg-blue-50 text-blue-700',
    amber: 'bg-amber-50 text-amber-700',
    purple: 'bg-purple-50 text-purple-700',
    emerald: 'bg-emerald-50 text-emerald-700',
    red: 'bg-red-50 text-red-700',
  }

  const content = (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
      </div>
      {Icon && (
        <div className={`rounded-xl p-3 ${colorClasses[color] || colorClasses.prastav}`}>
          <Icon className="h-6 w-6" />
        </div>
      )}
    </div>
  )

  const classes = "rounded-2xl bg-white p-5 shadow-md block border border-transparent transition-all duration-200"

  if (to) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ scale: 1.03, borderColor: '#0D723B', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
        whileTap={{ scale: 0.98 }}
        className="h-full"
      >
        <Link to={to} className={`${classes} hover:border-prastav-200 cursor-pointer h-full`}>
          {content}
        </Link>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={classes}
    >
      {content}
    </motion.div>
  )
}
