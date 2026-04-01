'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Mic, MicOff, PhoneOff, Phone, Radio } from 'lucide-react'

type CallStatus = 'idle' | 'connecting' | 'active' | 'ended' | 'error'

interface TranscriptLine {
  role: 'agent' | 'user'
  text: string
  ts: number
}

// ─── Waveform bars component ────────────────────────────────────────────────
function WaveformBars({ active, volume }: { active: boolean; volume: number }) {
  const BAR_COUNT = 20
  return (
    <div className="flex items-center justify-center gap-[3px]" style={{ height: 80 }}>
      {Array.from({ length: BAR_COUNT }).map((_, i) => {
        // Create a natural wave pattern — center bars are taller
        const center = BAR_COUNT / 2
        const distFromCenter = Math.abs(i - center) / center
        const baseHeight = active
          ? Math.max(8, (1 - distFromCenter * 0.6) * 60 * (0.4 + volume * 0.6))
          : 8
        const delay = (i % 5) * 80
        return (
          <div
            key={i}
            style={{
              width: 4,
              height: active ? baseHeight : 8,
              borderRadius: 99,
              background: active
                ? `oklch(0.49 0.263 281 / ${0.5 + volume * 0.5})`
                : 'var(--border)',
              transition: active ? `height 150ms ease ${delay}ms` : 'height 400ms ease',
              animation: active ? `pulse-bar 1.2s ease-in-out ${delay}ms infinite alternate` : 'none',
            }}
          />
        )
      })}
    </div>
  )
}

// ─── Main page ───────────────────────────────────────────────────────────────
export default function AgentTestPage() {
  const params = useParams()
  const router = useRouter()
  const id = params?.id as string

  const [status, setStatus] = useState<CallStatus>('idle')
  const [muted, setMuted] = useState(false)
  const [volume, setVolume] = useState(0)
  const [transcript, setTranscript] = useState<TranscriptLine[]>([])
  const [errorMsg, setErrorMsg] = useState('')
  const transcriptRef = useRef<HTMLDivElement>(null)

  // Provider-specific session refs
  const vapiRef = useRef<any>(null)
  const ultravoxRef = useRef<any>(null)

  const { data: agent, isLoading } = useQuery({
    queryKey: ['agent', id],
    queryFn: () => fetch(`/api/agents/${id}`).then((r) => r.json()),
    enabled: !!id,
  })

  // Auto-scroll transcript
  useEffect(() => {
    if (transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight
    }
  }, [transcript])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      endCall()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const addTranscriptLine = useCallback((role: 'agent' | 'user', text: string) => {
    setTranscript((prev) => {
      // Merge with last line if same role
      const last = prev[prev.length - 1]
      if (last && last.role === role && Date.now() - last.ts < 3000) {
        return [...prev.slice(0, -1), { role, text: last.text + ' ' + text, ts: Date.now() }]
      }
      return [...prev, { role, text, ts: Date.now() }]
    })
  }, [])

  // ─── VAPI call ─────────────────────────────────────────────────────────────
  const startVapiCall = useCallback(async (assistantConfig: Record<string, unknown>) => {
    const publicKey = process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY
    if (!publicKey) {
      setErrorMsg('NEXT_PUBLIC_VAPI_PUBLIC_KEY is not configured. Add it to your .env.local file.')
      setStatus('error')
      return
    }

    try {
      // Dynamic import to avoid SSR issues
      const { default: Vapi } = await import('@vapi-ai/web')
      const vapi = new Vapi(publicKey)
      vapiRef.current = vapi

      vapi.on('call-start', () => setStatus('active'))
      vapi.on('call-end', () => {
        setStatus('ended')
        setVolume(0)
      })
      vapi.on('error', (e: unknown) => {
        console.error('VAPI error:', e)
        setErrorMsg('Call error. Check console for details.')
        setStatus('error')
        setVolume(0)
      })
      vapi.on('volume-level', (level: number) => setVolume(level))
      vapi.on('message', (msg: any) => {
        if (msg.type === 'transcript') {
          const role = msg.role === 'assistant' ? 'agent' : 'user'
          if (msg.transcriptType === 'final' && msg.transcript) {
            addTranscriptLine(role, msg.transcript)
          }
        }
      })

      await vapi.start(assistantConfig)
    } catch (err) {
      console.error('VAPI start error:', err)
      setErrorMsg('Failed to start VAPI call. Make sure your public key is valid.')
      setStatus('error')
    }
  }, [addTranscriptLine])

  // ─── Ultravox call ─────────────────────────────────────────────────────────
  const startUltravoxCall = useCallback(async (joinUrl: string) => {
    try {
      // Dynamic import
      const { UltravoxSession } = await import('ultravox-client')
      const session = new UltravoxSession()
      ultravoxRef.current = session

      session.addEventListener('status', () => {
        const s = String(session.status).toLowerCase()
        if (s.includes('idle')) setStatus('idle')
        else if (s.includes('connect') || s.includes('dial')) setStatus('connecting')
        else if (s.includes('listen') || s.includes('think') || s.includes('speak')) setStatus('active')
        else if (s.includes('disconnect')) {
          setStatus('ended')
          setVolume(0)
        }
      })

      session.addEventListener('transcripts', () => {
        const transcripts = session.transcripts
        if (!transcripts?.length) return
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const latest = transcripts[transcripts.length - 1] as any
        if (latest?.isFinal || latest?.final) {
          const role = latest.speaker === 'agent' ? 'agent' : 'user'
          addTranscriptLine(role, latest.text || '')
        }
      })

      // Simple volume simulation via Web Audio API on mic
      startMicVolumeDetection()

      await session.joinCall(joinUrl)
    } catch (err) {
      console.error('Ultravox start error:', err)
      setErrorMsg('Failed to connect to Ultravox. Check your API key and try again.')
      setStatus('error')
    }
  }, [addTranscriptLine])

  // ─── Mic volume detection (for Ultravox / providers without volume events) ──
  const audioCtxRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const volumeAnimRef = useRef<number>(0)

  const startMicVolumeDetection = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const ctx = new AudioContext()
      audioCtxRef.current = ctx
      const analyser = ctx.createAnalyser()
      analyserRef.current = analyser
      analyser.fftSize = 256
      const source = ctx.createMediaStreamSource(stream)
      source.connect(analyser)
      const data = new Uint8Array(analyser.frequencyBinCount)

      const tick = () => {
        analyser.getByteFrequencyData(data)
        const avg = data.reduce((a, b) => a + b, 0) / data.length
        setVolume(Math.min(1, avg / 80))
        volumeAnimRef.current = requestAnimationFrame(tick)
      }
      tick()
    } catch {
      // Mic access denied — no volume visualization
    }
  }

  const stopMicVolumeDetection = () => {
    if (volumeAnimRef.current) cancelAnimationFrame(volumeAnimRef.current)
    audioCtxRef.current?.close()
    audioCtxRef.current = null
  }

  // ─── Start call ────────────────────────────────────────────────────────────
  const startCall = async () => {
    if (!agent) return
    setStatus('connecting')
    setTranscript([])
    setErrorMsg('')

    try {
      const res = await fetch(`/api/agents/${id}/test-call`, { method: 'POST' })
      const data = await res.json()

      if (!res.ok || data.error) {
        setErrorMsg(data.error || 'Failed to initialize call session.')
        setStatus('error')
        return
      }

      if (data.provider === 'VAPI') {
        await startVapiCall(data.assistantConfig)
      } else if (data.provider === 'ULTRAVOX') {
        await startUltravoxCall(data.joinUrl)
      } else {
        setErrorMsg(`Live browser testing is not available for ${data.provider}.`)
        setStatus('error')
      }
    } catch (err) {
      console.error('Start call error:', err)
      setErrorMsg('Network error. Please check your connection.')
      setStatus('error')
    }
  }

  // ─── End call ──────────────────────────────────────────────────────────────
  const endCall = useCallback(() => {
    if (vapiRef.current) {
      try { vapiRef.current.stop() } catch { /* ignore */ }
      vapiRef.current = null
    }
    if (ultravoxRef.current) {
      try { ultravoxRef.current.leaveCall() } catch { /* ignore */ }
      ultravoxRef.current = null
    }
    stopMicVolumeDetection()
    setStatus('ended')
    setVolume(0)
  }, [])

  // ─── Mute/unmute ──────────────────────────────────────────────────────────
  const toggleMute = () => {
    if (vapiRef.current) {
      vapiRef.current.setMuted(!muted)
    }
    if (ultravoxRef.current) {
      if (muted) ultravoxRef.current.unmuteMic()
      else ultravoxRef.current.muteMic()
    }
    setMuted((m) => !m)
  }

  // ─── Render ───────────────────────────────────────────────────────────────
  const agentAny = agent as any
  const accentColor = 'oklch(0.49 0.263 281)'
  const accentBg = 'oklch(0.49 0.263 281 / 10%)'

  const isActive = status === 'active'
  const isConnecting = status === 'connecting'
  const isCallInProgress = isActive || isConnecting

  return (
    <>
      {/* Waveform animation keyframes injected via style tag */}
      <style>{`
        @keyframes pulse-bar {
          from { transform: scaleY(0.6); }
          to { transform: scaleY(1); }
        }
      `}</style>

      <div className="max-w-2xl mx-auto space-y-5">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => { endCall(); router.back() }}
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 hover:scale-105"
            style={{ border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--muted-foreground)' }}
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-xl font-bold" style={{ color: 'var(--foreground)' }}>
              {isLoading ? 'Loading…' : agentAny?.name || 'Agent Test'}
            </h1>
            <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
              Live voice testing
            </p>
          </div>
          {agentAny && (
            <span
              className="ml-auto text-[10px] font-bold px-2 py-1 rounded-lg"
              style={{ background: accentBg, color: accentColor }}
            >
              AI Agent
            </span>
          )}
        </div>

        {/* Main call card */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            background: 'var(--card)',
            border: isActive ? `1px solid ${accentColor}` : '1px solid var(--border)',
            boxShadow: isActive ? `0 0 0 3px ${accentBg}` : 'none',
            transition: 'all 0.4s ease',
          }}
        >
          {/* Provider bar */}
          <div
            className="px-5 py-3 flex items-center gap-2"
            style={{ borderBottom: '1px solid var(--border)', background: 'var(--muted)' }}
          >
            <Radio
              className="w-3.5 h-3.5"
              style={{ color: isActive ? accentColor : 'var(--muted-foreground)' }}
            />
            <span className="text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>
              {status === 'idle' ? 'Ready' :
               status === 'connecting' ? 'Connecting…' :
               status === 'active' ? 'Live' :
               status === 'ended' ? 'Call ended' : 'Error'}
            </span>
            {isActive && (
              <span
                className="ml-auto flex items-center gap-1.5 text-[10px] font-semibold"
                style={{ color: accentColor }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full animate-pulse"
                  style={{ background: accentColor }}
                />
                LIVE
              </span>
            )}
          </div>

          {/* Waveform area */}
          <div
            className="flex flex-col items-center justify-center py-12 px-6"
            style={{
              background: isActive
                ? `linear-gradient(180deg, ${accentBg} 0%, transparent 100%)`
                : 'var(--card)',
              transition: 'background 0.5s ease',
            }}
          >
            {/* Agent avatar */}
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center mb-8 transition-all duration-300"
              style={{
                background: isActive ? accentBg : 'var(--muted)',
                border: isActive ? `2px solid ${accentColor}` : '2px solid var(--border)',
                boxShadow: isActive ? `0 0 24px ${accentBg}` : 'none',
              }}
            >
              {isConnecting ? (
                <span
                  className="w-8 h-8 rounded-full border-4 border-t-transparent animate-spin"
                  style={{ borderColor: accentBg, borderTopColor: accentColor }}
                />
              ) : (
                <Radio
                  className="w-9 h-9 transition-all"
                  style={{ color: isActive ? accentColor : 'var(--muted-foreground)' }}
                />
              )}
            </div>

            {/* Waveform */}
            <WaveformBars active={isActive} volume={volume} />

            {/* Status text */}
            <p
              className="mt-6 text-sm font-medium transition-all"
              style={{ color: isActive ? 'var(--foreground)' : 'var(--muted-foreground)' }}
            >
              {status === 'idle' && 'Click Start Call to begin testing'}
              {status === 'connecting' && 'Establishing connection…'}
              {status === 'active' && (muted ? '🎙️ Muted — agent is listening' : '🎙️ Speak now — agent is listening')}
              {status === 'ended' && 'Call ended — start a new one anytime'}
              {status === 'error' && errorMsg}
            </p>
          </div>

          {/* Controls */}
          <div
            className="px-6 py-5 flex items-center justify-center gap-4"
            style={{ borderTop: '1px solid var(--border)', background: 'var(--muted)' }}
          >
            {!isCallInProgress ? (
              <button
                onClick={startCall}
                disabled={isLoading || !!agentAny?.error}
                className="flex items-center gap-2.5 px-8 py-3.5 rounded-2xl font-semibold text-white transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: 'linear-gradient(135deg, oklch(0.49 0.263 281), oklch(0.65 0.22 310))',
                  boxShadow: '0 4px 20px oklch(0.49 0.263 281 / 40%)',
                }}
              >
                <Phone className="w-5 h-5" />
                {status === 'ended' ? 'Call Again' : 'Start Call'}
              </button>
            ) : (
              <div className="flex items-center gap-3">
                {/* Mute button */}
                <button
                  onClick={toggleMute}
                  disabled={!isActive}
                  className="w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-40"
                  style={{
                    background: muted ? 'oklch(0.59 0.245 15 / 15%)' : 'var(--card)',
                    border: muted ? '1px solid oklch(0.59 0.245 15 / 40%)' : '1px solid var(--border)',
                    color: muted ? 'oklch(0.52 0.245 15)' : 'var(--foreground)',
                  }}
                >
                  {muted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </button>

                {/* End call button */}
                <button
                  onClick={endCall}
                  className="flex items-center gap-2.5 px-8 py-3.5 rounded-2xl font-semibold text-white transition-all duration-200 hover:scale-105 active:scale-95"
                  style={{
                    background: 'oklch(0.49 0.245 15)',
                    boxShadow: '0 4px 20px oklch(0.49 0.245 15 / 40%)',
                  }}
                >
                  <PhoneOff className="w-5 h-5" />
                  End Call
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Transcript */}
        {(transcript.length > 0 || isActive) && (
          <div
            className="rounded-2xl overflow-hidden"
            style={{ border: '1px solid var(--border)' }}
          >
            <div
              className="px-5 py-3 flex items-center gap-2"
              style={{ background: 'var(--card)', borderBottom: '1px solid var(--border)' }}
            >
              <Mic className="w-3.5 h-3.5" style={{ color: 'var(--muted-foreground)' }} />
              <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted-foreground)' }}>
                Live Transcript
              </span>
              {isActive && (
                <span
                  className="ml-auto w-1.5 h-1.5 rounded-full animate-pulse"
                  style={{ background: accentColor }}
                />
              )}
            </div>

            <div
              ref={transcriptRef}
              className="p-4 space-y-3 overflow-y-auto"
              style={{
                background: 'var(--card)',
                maxHeight: 280,
                minHeight: transcript.length === 0 ? 80 : undefined,
              }}
            >
              {transcript.length === 0 ? (
                <p className="text-center text-xs py-4" style={{ color: 'var(--muted-foreground)' }}>
                  Transcript will appear here as the conversation progresses…
                </p>
              ) : (
                transcript.map((line, i) => (
                  <div
                    key={i}
                    className={`flex gap-2.5 ${line.role === 'user' ? 'flex-row-reverse' : ''}`}
                  >
                    <div
                      className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 text-[10px] font-bold"
                      style={{
                        background: line.role === 'agent' ? accentBg : 'oklch(0.6 0.19 220 / 10%)',
                        color: line.role === 'agent' ? accentColor : 'oklch(0.5 0.19 220)',
                      }}
                    >
                      {line.role === 'agent' ? 'A' : 'Y'}
                    </div>
                    <div
                      className="rounded-xl px-3 py-2 text-xs leading-relaxed max-w-[80%]"
                      style={{
                        background: line.role === 'agent' ? accentBg : 'oklch(0.6 0.19 220 / 8%)',
                        color: 'var(--foreground)',
                      }}
                    >
                      {line.text}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Setup info */}
        {status === 'idle' && agentAny && (
          <div
            className="rounded-2xl p-4 space-y-3"
            style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
          >
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted-foreground)' }}>
              Test Setup
            </p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Agent', value: agentAny.name },
                { label: 'Voice', value: agentAny.voice || 'Default' },
                { label: 'Language', value: agentAny.language?.toUpperCase() || 'EN' },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-[10px] font-semibold uppercase tracking-wider mb-0.5" style={{ color: 'var(--muted-foreground)' }}>
                    {label}
                  </p>
                  <p className="text-xs font-medium" style={{ color: 'var(--foreground)' }}>{value}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  )
}
