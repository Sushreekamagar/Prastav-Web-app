import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  HiOutlineUsers,
  HiOutlineBookOpen,
  HiOutlineSwitchHorizontal,
  HiOutlineShieldExclamation,
  HiOutlineUserRemove,
  HiOutlineTrash,
} from 'react-icons/hi'
import { DashboardPage } from '../../layouts/DashboardLayout'
import StatCard from '../../components/dashboard/StatCard'
import Button from '../../components/ui/Button'
import PageTransition from '../../components/ui/PageTransition'
import { getAdminStats } from '../../services/adminService'
import { DashboardSkeleton } from '../../components/ui/LoadingSkeleton'

export default function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadStats() {
      try {
        const data = await getAdminStats()
        setStats(data)
      } catch (err) {
        setError(err.message || 'Failed to fetch admin statistics.')
      } finally {
        setLoading(false)
      }
    }
    loadStats()
    window.addEventListener('refresh-data', loadStats)
    return () => window.removeEventListener('refresh-data', loadStats)
  }, [])

  if (loading) {
    return (
      <DashboardPage title="Admin Dashboard" subtitle="Loading metrics...">
        <DashboardSkeleton />
      </DashboardPage>
    )
  }

  return (
    <DashboardPage
      title="Admin Control Center"
      subtitle="Overview of the Prastav marketplace ecosystem."
    >
      <PageTransition>
        {error && (
          <div className="mb-6 rounded-xl bg-red-50 p-4 text-sm text-red-600 border border-red-200">
            {error}
          </div>
        )}

        {/* Hero banner */}
        <div className="rounded-2xl bg-gradient-to-r from-prastav-800 to-slate-900 p-6 text-white shadow-lg sm:p-8">
          <h2 className="text-xl font-bold sm:text-2xl">Platform Safety & Management</h2>
          <p className="mt-2 max-w-xl text-slate-200 text-sm">
            Monitor activities, manage user account statuses, review flagged listings/books, and audit administrative actions.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button to="/dashboard/admin/users?isReported=true" variant="secondary" size="sm">
              Review Flagged Users
            </Button>
            <Button to="/dashboard/admin/books?isReported=true" variant="outline" size="sm" className="!border-white !text-white hover:!bg-white/10">
              Review Flagged Books
            </Button>
            <Button to="/dashboard/admin/transactions" variant="outline" size="sm" className="!border-white !text-white hover:!bg-white/10">
              Review Transactions
            </Button>
          </div>
        </div>

        {/* Statistics Grid */}
        <div className="mt-8 space-y-8">
          {/* User Stats */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <HiOutlineUsers className="h-5 w-5 text-prastav-700" />
              Users Stats
            </h3>
            <div className="grid gap-4 sm:grid-cols-3">
              <StatCard label="Total Users" value={stats?.users?.total ?? 0} icon={HiOutlineUsers} color="blue" to="/dashboard/admin/users" />
              <StatCard label="Active Users" value={stats?.users?.active ?? 0} icon={HiOutlineUsers} color="emerald" to="/dashboard/admin/users?status=active" />
              <StatCard label="Suspended Users" value={stats?.users?.suspended ?? 0} icon={HiOutlineUserRemove} color="red" to="/dashboard/admin/users?status=suspended" />
            </div>
            <div className="mt-2 text-xs text-gray-500 pl-1">
              New Signups: {stats?.users?.joinedToday ?? 0} today / {stats?.users?.joinedThisMonth ?? 0} this month
            </div>
          </div>
 
          {/* Book Stats */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <HiOutlineBookOpen className="h-5 w-5 text-prastav-700" />
              Books Stats
            </h3>
            <div className="grid gap-4 sm:grid-cols-3">
              <StatCard label="Total Listings" value={stats?.books?.total ?? 0} icon={HiOutlineBookOpen} color="blue" to="/dashboard/admin/books" />
              <StatCard label="Flagged Listings" value={stats?.books?.reported ?? 0} icon={HiOutlineShieldExclamation} color="amber" to="/dashboard/admin/books?isReported=true" />
              <StatCard label="Deleted Listings" value={stats?.books?.deleted ?? 0} icon={HiOutlineTrash} color="red" to="/dashboard/admin/books?isDeleted=true" />
            </div>
          </div>
 
          {/* Transaction Stats */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <HiOutlineSwitchHorizontal className="h-5 w-5 text-prastav-700" />
              Transactions Stats
            </h3>
            <div className="grid gap-4 sm:grid-cols-3">
              <StatCard label="Total Exchanges" value={stats?.transactions?.total ?? 0} icon={HiOutlineSwitchHorizontal} color="blue" to="/dashboard/admin/transactions" />
              <StatCard label="Completed Deals" value={stats?.transactions?.completed ?? 0} icon={HiOutlineSwitchHorizontal} color="emerald" to="/dashboard/admin/transactions?status=completed" />
              <StatCard label="Pending Deals" value={stats?.transactions?.pending ?? 0} icon={HiOutlineSwitchHorizontal} color="amber" to="/dashboard/admin/transactions?status=pending" />
            </div>
            <div className="mt-2 text-xs text-gray-500 pl-1">
              Activity: {stats?.transactions?.today ?? 0} deals initiated today / {stats?.transactions?.thisMonth ?? 0} this month
            </div>
          </div>
        </div>

        {/* Audit Log Quick Link */}
        <div className="mt-8 rounded-2xl bg-white border border-gray-100 p-6 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h4 className="font-bold text-gray-900">Audit Trail Logs</h4>
            <p className="text-xs text-gray-500 mt-1">Review all administrative updates, role switches, and moderation updates.</p>
          </div>
          <Button to="/dashboard/admin/logs" variant="outline" size="sm">
            View Audit Trail
          </Button>
        </div>
      </PageTransition>
    </DashboardPage>
  )
}
