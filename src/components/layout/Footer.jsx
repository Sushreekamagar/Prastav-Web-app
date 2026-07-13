import { Link } from 'react-router-dom'
import Container from '../ui/Container'
import { APP_NAME, FOOTER_LINKS } from '../../utils/constants'

export default function Footer() {
  return (
    <footer className="border-t border-prastav-100 bg-prastav-50 py-10">
      <Container>
        <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
          <div>
            <Link to="/" className="text-xl font-bold text-prastav-800">
              {APP_NAME}
            </Link>
            <p className="mt-2 text-sm text-gray-500">
              © {new Date().getFullYear()} {APP_NAME}. Curated for the Living Library.
            </p>
          </div>

          <div className="flex flex-wrap gap-6">
            {FOOTER_LINKS.product.map((link) =>
              link.href.startsWith('#') ? (
                <a
                  key={link.label}
                  href={link.href}
                  className="text-sm font-medium text-gray-600 transition-colors hover:text-prastav-700"
                >
                  {link.label}
                </a>
              ) : (
                <Link
                  key={link.label}
                  to={link.href}
                  className="text-sm font-medium text-gray-600 transition-colors hover:text-prastav-700"
                >
                  {link.label}
                </Link>
              ),
            )}
            {FOOTER_LINKS.legal.map((link) => (
              <Link
                key={link.label}
                to={link.href}
                className="text-sm font-medium text-gray-600 transition-colors hover:text-prastav-700"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </Container>
    </footer>
  )
}
