import { useDashboardMode } from '../../hooks/useDashboardMode'
import { useAuth } from '../../context/AuthContext'
import BuyerDashboard from './BuyerDashboard'
import SellerDashboard from './SellerDashboard'
import AdminDashboard from './AdminDashboard'

export default function DashboardHome() {
  const { user } = useAuth()
  const { isSeller } = useDashboardMode()

  if (user?.role === 'admin') {
    return <AdminDashboard />
  }

  return isSeller ? <SellerDashboard /> : <BuyerDashboard />
}
