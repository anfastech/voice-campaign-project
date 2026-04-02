'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import { Play, Pause } from 'lucide-react'
import { Button } from '@/components/ui/button'

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

interface AudioPlayerProps {
  src: string
  duration?: number | null
}

export function AudioPlayer({ src, duration }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [audioDuration, setAudioDuration] = useState(duration || 0)

  // Generate stable waveform bars
  const bars = useMemo(() => {
    return Array.from({ length: 80 }, (_, i) => {
      const seed = Math.sin(i * 1.5) * 0.5 + Math.sin(i * 0.3) * 0.3 + 0.5
      return Math.max(15, Math.min(100, seed * 100))
    })
  }, [])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    const onTimeUpdate = () => setCurrentTime(audio.currentTime)
    const onLoadedMetadata = () => setAudioDuration(audio.duration)
    const onEnded = () => setIsPlaying(false)
    audio.addEventListener('timeupdate', onTimeUpdate)
    audio.addEventListener('loadedmetadata', onLoadedMetadata)
    audio.addEventListener('ended', onEnded)
    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate)
      audio.removeEventListener('loadedmetadata', onLoadedMetadata)
      audio.removeEventListener('ended', onEnded)
    }
  }, [])

  const togglePlay = () => {
    if (!audioRef.current) return
    if (isPlaying) audioRef.current.pause()
    else audioRef.current.play()
    setIsPlaying(!isPlaying)
  }

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !audioDuration) return
    const rect = e.currentTarget.getBoundingClientRect()
    const pct = (e.clientX - rect.left) / rect.width
    audioRef.current.currentTime = pct * audioDuration
  }

  const progress = audioDuration > 0 ? (currentTime / audioDuration) * 100 : 0

  return (
    <div className="border-t border-border px-4 py-3 flex items-center gap-3 bg-background">
      <audio ref={audioRef} src={src} preload="metadata" />

      <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={togglePlay}>
        {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
      </Button>

      <span className="text-xs text-muted-foreground tabular-nums w-10 shrink-0">
        {formatTime(currentTime)}
      </span>

      <div className="flex-1 h-8 flex items-center cursor-pointer" onClick={seek}>
        <div className="w-full h-6 relative flex items-end gap-px">
          {bars.map((height, i) => {
            const barProgress = (i / bars.length) * 100
            return (
              <div
                key={i}
                className="flex-1 rounded-sm transition-colors"
                style={{
                  height: `${height}%`,
                  backgroundColor: barProgress <= progress
                    ? 'var(--primary)'
                    : 'color-mix(in srgb, var(--muted-foreground) 20%, transparent)',
                }}
              />
            )
          })}
        </div>
      </div>

      <span className="text-xs text-muted-foreground tabular-nums w-10 shrink-0 text-right">
        {formatTime(audioDuration)}
      </span>
    </div>
  )
}
