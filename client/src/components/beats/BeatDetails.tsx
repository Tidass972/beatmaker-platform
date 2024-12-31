'use client';

import AudioPlayer from '@/components/ui/AudioPlayer'
import Image from 'next/image'
import Link from 'next/link'

interface License {
  name: string;
  price: number;
  features: string[];
}

interface Producer {
  name: string;
  id: string;
  avatar: string;
}

interface Beat {
  id: string;
  title: string;
  producer: Producer;
  coverImage: string;
  audioUrl: string;
  price: number;
  genre: string;
  bpm: number;
  description: string;
  tags: string[];
  duration: string;
  licenses: License[];
}

interface BeatDetailsProps {
  beat: Beat;
}

export default function BeatDetails({ beat }: BeatDetailsProps) {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* En-tête du beat */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        {/* Image et lecteur audio */}
        <div className="space-y-4">
          <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-900">
            <Image
              src={beat.coverImage}
              alt={beat.title}
              fill
              className="object-cover"
              priority
            />
          </div>
          <AudioPlayer src={beat.audioUrl} className="w-full" />
        </div>

        {/* Informations du beat */}
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">{beat.title}</h1>
            <Link 
              href={`/producers/${beat.producer.id}`}
              className="text-blue-500 hover:text-blue-400 transition-colors"
            >
              {beat.producer.name}
            </Link>
          </div>

          <div className="flex items-center gap-4 text-gray-400">
            <span>{beat.genre}</span>
            <span>•</span>
            <span>{beat.bpm} BPM</span>
            <span>•</span>
            <span>{beat.duration}</span>
          </div>

          <p className="text-gray-300">{beat.description}</p>

          <div className="flex flex-wrap gap-2">
            {beat.tags.map((tag) => (
              <span 
                key={tag}
                className="px-3 py-1 bg-gray-800 rounded-full text-sm text-gray-300"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Licences */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6 text-white">Licences disponibles</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {beat.licenses.map((license) => (
            <div 
              key={license.name}
              className="bg-gray-900 border border-gray-800 rounded-lg p-6 space-y-4"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-white">{license.name}</h3>
                <span className="text-2xl font-bold text-blue-500">{license.price}€</span>
              </div>
              <ul className="space-y-2">
                {license.features.map((feature) => (
                  <li key={feature} className="flex items-center text-gray-300">
                    <span className="mr-2">✓</span>
                    {feature}
                  </li>
                ))}
              </ul>
              <button className="btn btn-primary w-full mt-4">
                Acheter maintenant
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Beats similaires */}
      <section>
        <h2 className="text-2xl font-bold mb-6 text-white">Beats similaires</h2>
        {/* Liste des beats similaires à ajouter */}
      </section>
    </div>
  )
}
