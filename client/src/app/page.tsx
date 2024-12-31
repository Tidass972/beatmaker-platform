import BeatCard from '@/components/beats/BeatCard'

// Données de test (à remplacer par des données réelles de l'API)
const mockBeats = [
  {
    id: '1',
    title: 'Summer Vibes',
    producer: {
      name: 'BeatMaster',
      id: 'prod1'
    },
    coverImage: '/images/beats/summer-vibes.jpg',
    price: 29.99,
    genre: 'Hip Hop'
  },
  {
    id: '2',
    title: 'Night Rider',
    producer: {
      name: 'WaveMaker',
      id: 'prod2'
    },
    coverImage: '/images/beats/night-rider.jpg',
    price: 34.99,
    genre: 'Trap'
  },
  {
    id: '3',
    title: 'Urban Dreams',
    producer: {
      name: 'SoundArchitect',
      id: 'prod3'
    },
    coverImage: '/images/beats/urban-dreams.jpg',
    price: 24.99,
    genre: 'R&B'
  }
]

export default function Home() {
  return (
    <div className="container mx-auto px-4">
      {/* Hero Section */}
      <section className="py-16 text-center">
        <h1 className="text-5xl font-bold mb-6 text-white">
          Découvrez les Meilleurs Beats
        </h1>
        <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
          Trouvez l'instrumental parfait pour votre prochain hit parmi notre sélection de beats de qualité professionnelle.
        </p>
        <div className="flex justify-center gap-4">
          <a href="/beats" className="btn btn-primary">
            Explorer les Beats
          </a>
          <a href="/upload" className="btn btn-outline">
            Vendre vos Beats
          </a>
        </div>
      </section>

      {/* Featured Beats */}
      <section className="py-12">
        <h2 className="text-3xl font-bold mb-8 text-white">Beats en Vedette</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockBeats.map((beat) => (
            <BeatCard key={beat.id} {...beat} />
          ))}
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 text-center bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-2xl my-12">
        <h2 className="text-3xl font-bold mb-4 text-white">
          Prêt à Vendre vos Beats ?
        </h2>
        <p className="text-gray-400 mb-8 max-w-2xl mx-auto">
          Rejoignez notre communauté de producteurs et commencez à vendre vos créations dès aujourd'hui.
        </p>
        <a href="/register" className="btn btn-primary">
          Commencer Maintenant
        </a>
      </section>
    </div>
  )
}
