import Image from 'next/image'
import Link from 'next/link'
import { FC } from 'react'

interface BeatCardProps {
  id: string
  title: string
  producer: {
    name: string
    id: string
  }
  coverImage: string
  price: number
  genre: string
}

const BeatCard: FC<BeatCardProps> = ({ id, title, producer, coverImage, price, genre }) => {
  return (
    <div className="card group">
      {/* Image de couverture */}
      <div className="relative aspect-video">
        <Image
          src={coverImage}
          alt={title}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <button className="btn btn-primary">
            <span className="mr-2">▶</span> Écouter
          </button>
        </div>
      </div>

      {/* Informations */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h3 className="font-semibold hover:text-primary transition-colors">
              <Link href={`/beats/${id}`}>{title}</Link>
            </h3>
            <Link 
              href={`/producers/${producer.id}`}
              className="text-sm text-gray-400 hover:text-white transition-colors"
            >
              {producer.name}
            </Link>
          </div>
          <span className="text-primary font-medium">{price}€</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-400">{genre}</span>
          <Link href={`/beats/${id}`} className="text-sm text-primary hover:underline">
            Plus de détails
          </Link>
        </div>
      </div>
    </div>
  )
}

export default BeatCard
