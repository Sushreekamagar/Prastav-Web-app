import { Outlet } from 'react-router-dom'
import Container from '../components/ui/Container'
import Logo from '../components/ui/Logo'

export default function AuthLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-prastav-50 via-white to-prastav-100">
      <Container className="flex flex-1 items-center justify-center py-12">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <Logo size="md" />
          </div>
          <div className="rounded-2xl bg-white p-8 shadow-xl">
            <Outlet />
          </div>
        </div>
      </Container>
    </div>
  )
}
