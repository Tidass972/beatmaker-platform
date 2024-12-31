import Link from 'next/link'
import { FC } from 'react'

const Navbar: FC = () => {
  return (
    <nav className="bg-black/90 backdrop-blur-lg border-b border-gray-800 fixed w-full z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="text-xl font-bold text-white">
            Beatmaker Platform
          </Link>

          {/* Navigation principale */}
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/beats" className="text-gray-300 hover:text-white transition-colors">
              Explorer
            </Link>
            <Link href="/producers" className="text-gray-300 hover:text-white transition-colors">
              Producteurs
            </Link>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-4">
            <Link href="/upload" className="btn btn-primary">
              Upload Beat
            </Link>
            <Link href="/login" className="btn btn-outline">
              Connexion
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar
