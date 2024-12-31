import { FC, useRef, useState, useEffect } from 'react'

interface AudioPlayerProps {
  src: string
  onPlay?: () => void
  className?: string
}

const AudioPlayer: FC<AudioPlayerProps> = ({ src, onPlay, className = '' }) => {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const [error, setError] = useState(false)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handleError = () => {
      setError(true)
      setIsPlaying(false)
    }

    const handleLoadedMetadata = () => {
      setDuration(audio.duration)
      setError(false)
    }

    const handleTimeUpdate = () => {
      setProgress((audio.currentTime / audio.duration) * 100)
    }

    const handleEnded = () => {
      setIsPlaying(false)
      setProgress(0)
      audio.currentTime = 0
    }

    audio.addEventListener('error', handleError)
    audio.addEventListener('loadedmetadata', handleLoadedMetadata)
    audio.addEventListener('timeupdate', handleTimeUpdate)
    audio.addEventListener('ended', handleEnded)

    return () => {
      audio.removeEventListener('error', handleError)
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
      audio.removeEventListener('timeupdate', handleTimeUpdate)
      audio.removeEventListener('ended', handleEnded)
    }
  }, [])

  const togglePlay = () => {
    if (!audioRef.current) return

    if (isPlaying) {
      audioRef.current.pause()
    } else {
      audioRef.current.play()
      onPlay?.()
    }
    setIsPlaying(!isPlaying)
  }

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current) return

    const progressBar = e.currentTarget
    const clickPosition = e.clientX - progressBar.getBoundingClientRect().left
    const percentage = (clickPosition / progressBar.offsetWidth) * 100
    const newTime = (percentage / 100) * duration

    audioRef.current.currentTime = newTime
    setProgress(percentage)
  }

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  return (
    <div className={`bg-darker-bg rounded-lg p-4 ${className}`}>
      <audio ref={audioRef} src={src} preload="metadata" />
      
      {error ? (
        <div className="text-red-500 text-sm">Erreur de chargement de l'audio</div>
      ) : (
        <>
          {/* Contrôles */}
          <div className="flex items-center space-x-4">
            <button
              onClick={togglePlay}
              className="w-10 h-10 rounded-full bg-primary flex items-center justify-center hover:bg-blue-600 transition-colors"
            >
              {isPlaying ? '⏸' : '▶'}
            </button>
            
            <div className="flex-1">
              {/* Barre de progression */}
              <div
                className="h-2 bg-gray-700 rounded-full cursor-pointer relative"
                onClick={handleProgressClick}
              >
                <div
                  className="absolute h-full bg-primary rounded-full"
                  style={{ width: `${progress}%` }}
                />
              </div>
              
              {/* Temps */}
              <div className="flex justify-between mt-1 text-sm text-gray-400">
                <span>{formatTime(audioRef.current?.currentTime || 0)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default AudioPlayer
