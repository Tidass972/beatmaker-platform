import BeatCard from '@/components/beats/BeatCard'
import { useState } from 'react'

// Données de test (à remplacer par des données réelles de l'API)
const mockBeats = Array.from({ length: 12 }, (_, i) => ({
  id: `${i + 1}`,
  title: `Beat Title ${i + 1}`,
  producer: {
    name: `Producer ${i + 1}`,
    id: `prod${i + 1}`
  },
  coverImage: '/images/beats/default.svg',
  price: 29.99 + i,
  genre: i % 2 === 0 ? 'Hip Hop' : 'Trap'
}))

export default function BeatsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* En-tête */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-4">Explorer les Beats</h1>
        <p className="text-gray-400">
          Découvrez notre collection de beats de qualité professionnelle
        </p>
      </div>

      {/* Filtres */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {/* Genre */}
        <select className="bg-gray-900 border border-gray-800 rounded-lg px-4 py-2 text-white">
          <option value="">Tous les genres</option>
          <option value="hip-hop">Hip Hop</option>
          <option value="trap">Trap</option>
          <option value="rnb">R&B</option>
        </select>

        {/* Prix */}
        <select className="bg-gray-900 border border-gray-800 rounded-lg px-4 py-2 text-white">
          <option value="">Prix</option>
          <option value="0-25">0€ - 25€</option>
          <option value="25-50">25€ - 50€</option>
          <option value="50+">50€ +</option>
        </select>

        {/* BPM */}
        <select className="bg-gray-900 border border-gray-800 rounded-lg px-4 py-2 text-white">
          <option value="">BPM</option>
          <option value="80-100">80-100</option>
          <option value="100-120">100-120</option>
          <option value="120-140">120-140</option>
          <option value="140+">140+</option>
        </select>

        {/* Tri */}
        <select className="bg-gray-900 border border-gray-800 rounded-lg px-4 py-2 text-white">
          <option value="recent">Plus récents</option>
          <option value="popular">Plus populaires</option>
          <option value="price-asc">Prix croissant</option>
          <option value="price-desc">Prix décroissant</option>
        </select>
      </div>

      {/* Liste des beats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {mockBeats.map((beat) => (
          <BeatCard key={beat.id} {...beat} />
        ))}
      </div>

      {/* Pagination */}
      <div className="flex justify-center mt-12 space-x-2">
        <button className="btn btn-outline px-4 py-2 disabled:opacity-50" disabled>
          Précédent
        </button>
        <button className="btn btn-primary px-4 py-2">1</button>
        <button className="btn btn-outline px-4 py-2">2</button>
        <button className="btn btn-outline px-4 py-2">3</button>
        <button className="btn btn-outline px-4 py-2">
          Suivant
        </button>
      </div>
    </div>
  )
}
