import Link from 'next/link'
import { FC } from 'react'

const Footer: FC = () => {
  return (
    <footer className="bg-darker-bg border-t border-gray-800 py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* À propos */}
          <div>
            <h3 className="text-lg font-semibold mb-4">À propos</h3>
            <p className="text-gray-400">
              Plateforme de vente de beats pour producteurs et artistes.
            </p>
          </div>

          {/* Liens rapides */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Liens rapides</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/beats" className="text-gray-400 hover:text-white transition-colors">
                  Explorer les beats
                </Link>
              </li>
              <li>
                <Link href="/producers" className="text-gray-400 hover:text-white transition-colors">
                  Producteurs
                </Link>
              </li>
              <li>
                <Link href="/upload" className="text-gray-400 hover:text-white transition-colors">
                  Upload
                </Link>
              </li>
            </ul>
          </div>

          {/* Aide */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Aide</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/faq" className="text-gray-400 hover:text-white transition-colors">
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-gray-400 hover:text-white transition-colors">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-gray-400 hover:text-white transition-colors">
                  Conditions d'utilisation
                </Link>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Newsletter</h3>
            <form className="space-y-4">
              <input
                type="email"
                placeholder="Votre email"
                className="w-full px-4 py-2 bg-card-bg border border-gray-700 rounded-lg focus:outline-none focus:border-primary"
              />
              <button type="submit" className="btn btn-primary w-full">
                S'abonner
              </button>
            </form>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-12 pt-8 border-t border-gray-800 text-center text-gray-400">
          <p>&copy; {new Date().getFullYear()} Beatmaker Platform. Tous droits réservés.</p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
