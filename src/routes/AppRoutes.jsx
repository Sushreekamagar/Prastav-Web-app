import { Routes, Route } from 'react-router-dom'
import PublicLayout from '../layouts/PublicLayout'
import AuthLayout from '../layouts/AuthLayout'
import DashboardLayout from '../layouts/DashboardLayout'
import ProtectedRoute, { GuestRoute } from './ProtectedRoute'

import LandingPage from '../pages/LandingPage'
import NotFoundPage, { PrivacyPage, TermsPage } from '../pages/ErrorPages'

import LoginPage from '../pages/auth/LoginPage'
import SignupPage from '../pages/auth/SignupPage'
import VerifyOtpPage from '../pages/auth/VerifyOtpPage'
import ForgotPasswordPage from '../pages/auth/ForgotPasswordPage'
import ResetPasswordPage from '../pages/auth/ResetPasswordPage'
import PreferencePage from '../pages/auth/PreferencePage'

import DashboardHome from '../pages/dashboard/DashboardHome'
import BrowseBooksPage from '../pages/dashboard/BrowseBooksPage'
import BookDetailPage from '../pages/dashboard/BookDetailPage'
import RecommendationsPage from '../pages/dashboard/RecommendationsPage'
import NearbySellersPage from '../pages/dashboard/NearbySellersPage'
import MyListingsPage from '../pages/dashboard/MyListingsPage'
import CreateListingPage from '../pages/dashboard/CreateListingPage'
import RequestsPage from '../pages/dashboard/RequestsPage'
import RequestDetailPage from '../pages/dashboard/RequestDetailPage'
import TransactionsPage from '../pages/dashboard/TransactionsPage'
import TransactionDetailPage from '../pages/dashboard/TransactionDetailPage'
import NotificationsPage from '../pages/dashboard/NotificationsPage'
import ChatPage from '../pages/dashboard/ChatPage'
import ProfilePage from '../pages/dashboard/ProfilePage'
import SettingsPage from '../pages/dashboard/SettingsPage'
import AdminUsersPage from '../pages/dashboard/AdminUsersPage'
import AdminBooksPage from '../pages/dashboard/AdminBooksPage'
import AdminLogsPage from '../pages/dashboard/AdminLogsPage'
import AdminTransactionsPage from '../pages/dashboard/AdminTransactionsPage'

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route index element={<LandingPage />} />
        <Route path="privacy" element={<PrivacyPage />} />
        <Route path="terms" element={<TermsPage />} />
      </Route>

      <Route element={<GuestRoute />}>
        <Route path="signup" element={<SignupPage />} />
        <Route element={<AuthLayout />}>
          <Route path="login" element={<LoginPage />} />
          <Route path="verify-otp" element={<VerifyOtpPage />} />
          <Route path="forgot-password" element={<ForgotPasswordPage />} />
          <Route path="reset-password" element={<ResetPasswordPage />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route path="dashboard/preferences" element={<PreferencePage />} />
        <Route element={<DashboardLayout />}>
          <Route path="dashboard" element={<DashboardHome />} />
          <Route path="dashboard/books" element={<BrowseBooksPage />} />
          <Route path="dashboard/books/:id" element={<BookDetailPage />} />
          <Route path="dashboard/recommendations" element={<RecommendationsPage />} />
          <Route path="dashboard/nearby" element={<NearbySellersPage />} />
          <Route path="dashboard/requests" element={<RequestsPage />} />
          <Route path="dashboard/requests/:id" element={<RequestDetailPage />} />
          <Route path="dashboard/transactions" element={<TransactionsPage />} />
          <Route path="dashboard/transactions/:id" element={<TransactionDetailPage />} />
          <Route path="dashboard/notifications" element={<NotificationsPage />} />
          <Route path="dashboard/chats" element={<ChatPage />} />
          <Route path="dashboard/profile" element={<ProfilePage />} />
          <Route path="dashboard/settings" element={<SettingsPage />} />

          <Route element={<ProtectedRoute sellerOnly />}>
            <Route path="dashboard/listings" element={<MyListingsPage />} />
            <Route path="dashboard/listings/new" element={<CreateListingPage />} />
            <Route path="dashboard/listings/edit/:id" element={<CreateListingPage />} />
          </Route>

          <Route element={<ProtectedRoute roles={['admin']} />}>
            <Route path="dashboard/admin/users" element={<AdminUsersPage />} />
            <Route path="dashboard/admin/books" element={<AdminBooksPage />} />
            <Route path="dashboard/admin/transactions" element={<AdminTransactionsPage />} />
            <Route path="dashboard/admin/logs" element={<AdminLogsPage />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
