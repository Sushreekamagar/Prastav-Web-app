import { Link } from 'react-router-dom'
import Container from '../components/ui/Container'
import Button from '../components/ui/Button'

export default function NotFoundPage() {
  return (
    <div className="flex min-h-[60vh] items-center bg-prastav-50 py-20">
      <Container className="text-center">
        <p className="text-7xl font-bold text-prastav-200">404</p>
        <h1 className="mt-4 text-3xl font-bold text-prastav-900">Page Not Found</h1>
        <p className="mt-2 text-gray-600">
          The page you are looking for does not exist or has been moved.
        </p>
        <div className="mt-8">
          <Button to="/">Back to Home</Button>
        </div>
      </Container>
    </div>
  )
}

export function UnauthorizedPage() {
  return (
    <div className="flex min-h-[60vh] items-center bg-prastav-50 py-20">
      <Container className="text-center">
        <p className="text-7xl font-bold text-prastav-200">401</p>
        <h1 className="mt-4 text-3xl font-bold text-prastav-900">Unauthorized</h1>
        <p className="mt-2 text-gray-600">
          You need to be logged in to access this page.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <Button to="/login">Login</Button>
          <Button to="/" variant="outline">
            Go Home
          </Button>
        </div>
      </Container>
    </div>
  )
}

export function PrivacyPage() {
  return (
    <div className="bg-white py-20">
      <Container className="prose prose-green max-w-3xl">
        <h1 className="text-3xl font-bold text-prastav-900">Privacy Policy</h1>
        <p className="mt-4 text-gray-600">
          Privacy policy content will be added here. This page is a placeholder for the Prastav
          privacy policy.
        </p>
        <Link to="/" className="mt-6 inline-block text-prastav-700 hover:underline">
          ← Back to Home
        </Link>
      </Container>
    </div>
  )
}

export function TermsPage() {
  return (
    <div className="bg-white py-20">
      <Container className="prose prose-green max-w-3xl">
        <h1 className="text-3xl font-bold text-prastav-900">Terms & Conditions</h1>
        <p className="mt-4 text-gray-600">
          Terms and conditions content will be added here. This page is a placeholder for the
          Prastav terms of service.
        </p>
        <Link to="/" className="mt-6 inline-block text-prastav-700 hover:underline">
          ← Back to Home
        </Link>
      </Container>
    </div>
  )
}
