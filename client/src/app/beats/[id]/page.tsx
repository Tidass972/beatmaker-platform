'use client';

import BeatDetails from '@/components/beats/BeatDetails'
import DemoAudioGenerator from '@/components/beats/DemoAudioGenerator'
import { useEffect, useState } from 'react'

// Cette fonction sera remplacée par un appel API réel
const getBeatDetails = async (id: string) => {
  return {
    id,
    title: 'Summer Vibes',
    producer: {
      name: 'BeatMaster',
      id: 'prod1',
      avatar: '/images/avatars/producer1.jpg'
    },
    coverImage: '/images/beats/default.svg',
    audioUrl: null, // On va le générer dynamiquement
    price: 29.99,
    genre: 'Hip Hop',
    bpm: 140,
    description: 'Un beat estival avec des mélodies accrocheuses et une ligne de basse puissante.',
    tags: ['hip hop', 'summer', 'melodic'],
    duration: '2:30',
    licenses: [
      {
        name: 'Basic',
        price: 29.99,
        features: ['MP3 Format', 'Usage non commercial', '5000 streams max']
      },
      {
        name: 'Premium',
        price: 79.99,
        features: ['WAV Format', 'Usage commercial', 'Streams illimités']
      },
      {
        name: 'Exclusive',
        price: 299.99,
        features: ['Tous les formats', 'Droits exclusifs', 'Fichiers stems']
      }
    ]
  }
}

export default function BeatPage({ params }: { params: { id: string } }) {
  const [beat, setBeat] = useState<any>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)

  useEffect(() => {
    getBeatDetails(params.id).then(setBeat)
  }, [params.id])

  const handleAudioGenerated = (blob: Blob) => {
    const url = URL.createObjectURL(blob)
    setAudioUrl(url)
  }

  if (!beat) {
    return <div>Chargement...</div>
  }

  return (
    <>
      <DemoAudioGenerator onGenerate={handleAudioGenerated} />
      <BeatDetails beat={{ ...beat, audioUrl: audioUrl || undefined }} />
    </>
  )
}
