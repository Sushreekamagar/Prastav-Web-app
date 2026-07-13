import { useDashboardMode } from '../../hooks/useDashboardMode'
import BuyerDashboard from './BuyerDashboard'
import SellerDashboard from './SellerDashboard'

export default function DashboardHome() {
  const { isSeller } = useDashboardMode()
  return isSeller ? <SellerDashboard /> : <BuyerDashboard />
}
