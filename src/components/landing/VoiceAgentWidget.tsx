"use client"

import { useEffect, useState, useRef } from "react"
import { Mic, Phone, PhoneOff, Volume2 } from "lucide-react"

const CONVERSATION = [
  { role: "agent", text: "Hi Sarah, this is Aria calling from NovaTech. How are you today?", delay: 800 },
  { role: "user", text: "I'm good thanks, who is this?", delay: 3200 },
  { role: "agent", text: "I'm an AI assistant calling about our enterprise voice solution. Do you have 2 minutes?", delay: 5000 },
  { role: "user", text: "Sure, go ahead.", delay: 7800 },
  { role: "agent", text: "We help companies scale outbound calls 10x with AI. I'd love to book a demo for you.", delay: 9200 },
]

function AudioWave({ active }: { active: boolean }) {
  return (
    <div className="flex items-center gap-[3px] h-5">
      {[1, 2, 3, 4, 5, 4, 3, 2, 1].map((h, i) => (
        <div
          key={i}
          className="rounded-full transition-all"
          style={{
            width: "3px",
            background: active ? "oklch(0.68 0.22 281)" : "oklch(0.68 0.22 281 / 30%)",
            height: active ? `${h * 4}px` : "4px",
            animationName: active ? "wave-bar" : "none",
            animationDuration: `${0.5 + i * 0.07}s`,
            animationTimingFunction: "ease-in-out",
            animationIterationCount: "infinite",
            animationDirection: "alternate",
            animationDelay: `${i * 0.06}s`,
            transition: "height 0.2s ease",
          }}
        />
      ))}
    </div>
  )
}

function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-3 py-2 rounded-2xl rounded-tl-sm" style={{ background: "oklch(1 0 0 / 10%)" }}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="w-1.5 h-1.5 rounded-full"
          style={{
            background: "oklch(0.8 0.01 285)",
            animationName: "typing-dot",
            animationDuration: "1.2s",
            animationTimingFunction: "ease-in-out",
            animationIterationCount: "infinite",
            animationDelay: `${i * 0.2}s`,
          }}
        />
      ))}
    </div>
  )
}

export function VoiceAgentWidget() {
  const [visibleMessages, setVisibleMessages] = useState<number[]>([])
  const [typing, setTyping] = useState(false)
  const [callDuration, setCallDuration] = useState(0)
  const [agentSpeaking, setAgentSpeaking] = useState(false)
  const [callActive, setCallActive] = useState(false)
  const messagesContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const startDelay = setTimeout(() => {
      setCallActive(true)
      setAgentSpeaking(true)
    }, 1200)
    return () => clearTimeout(startDelay)
  }, [])

  useEffect(() => {
    if (!callActive) return
    const interval = setInterval(() => setCallDuration((d) => d + 1), 1000)
    return () => clearInterval(interval)
  }, [callActive])

  const [loopKey, setLoopKey] = useState(0)

  useEffect(() => {
    if (!callActive) return
    const timeouts: ReturnType<typeof setTimeout>[] = []

    CONVERSATION.forEach((msg, idx) => {
      const showTyping = setTimeout(() => {
        setTyping(true)
        setAgentSpeaking(msg.role === "agent")
      }, msg.delay - 600)

      const showMsg = setTimeout(() => {
        setTyping(false)
        setVisibleMessages((prev) => [...prev, idx])
        if (msg.role === "agent") setAgentSpeaking(true)
        else setAgentSpeaking(false)
      }, msg.delay)

      timeouts.push(showTyping, showMsg)
    })

    const restartAt = CONVERSATION[CONVERSATION.length - 1].delay + 4000
    const restart = setTimeout(() => {
      setVisibleMessages([])
      setAgentSpeaking(false)
      setTyping(false)
      setCallDuration(0)
      setLoopKey((k) => k + 1)
    }, restartAt)
    timeouts.push(restart)

    return () => timeouts.forEach(clearTimeout)
  }, [callActive, loopKey])

  useEffect(() => {
    messagesContainerRef.current?.scrollTo({
      top: messagesContainerRef.current.scrollHeight,
      behavior: "smooth",
    })
  }, [visibleMessages, typing])

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m}:${sec.toString().padStart(2, "0")}`
  }

  return (
    <>
      <style>{`
        @keyframes wave-bar {
          0% { transform: scaleY(0.5); }
          100% { transform: scaleY(1.2); }
        }
        @keyframes typing-dot {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-4px); opacity: 1; }
        }
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes call-ring {
          0%, 100% { box-shadow: 0 0 0 0 oklch(0.68 0.22 281 / 40%); }
          50% { box-shadow: 0 0 0 12px oklch(0.68 0.22 281 / 0%); }
        }
      `}</style>

      <div
        className="relative w-full max-w-sm mx-auto rounded-3xl overflow-hidden"
        style={{
          background: "oklch(0.09 0.02 285 / 85%)",
          backdropFilter: "blur(32px)",
          border: "1px solid oklch(1 0 0 / 12%)",
          boxShadow: "0 32px 80px oklch(0 0 0 / 50%), 0 0 0 1px oklch(0.49 0.263 281 / 20%)",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center gap-3 p-4"
          style={{ borderBottom: "1px solid oklch(1 0 0 / 8%)", background: "oklch(0.12 0.025 285 / 60%)" }}
        >
          {/* Agent avatar */}
          <div className="relative flex-shrink-0">
            <div
              className="w-11 h-11 rounded-2xl flex items-center justify-center text-white font-bold text-sm"
              style={{
                background: "linear-gradient(135deg, oklch(0.49 0.263 281), oklch(0.65 0.22 310))",
                boxShadow: agentSpeaking ? "0 0 0 0 oklch(0.68 0.22 281 / 40%)" : "none",
                animation: agentSpeaking ? "call-ring 1.5s ease-out infinite" : "none",
              }}
            >
              AI
            </div>
            <span
              className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2"
              style={{
                background: callActive ? "#34d399" : "oklch(0.6 0.015 285)",
                borderColor: "oklch(0.09 0.02 285)",
              }}
            />
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white leading-none">Aria — AI Agent</p>
            <div className="flex items-center gap-2 mt-1">
              <AudioWave active={agentSpeaking} />
              {callActive && (
                <span className="text-[10px] tabular-nums" style={{ color: "oklch(0.62 0.015 285)" }}>
                  {formatTime(callDuration)}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div
              className="flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-semibold"
              style={{ background: "oklch(0.55 0.215 163 / 15%)", color: "oklch(0.65 0.19 163)" }}
            >
              <span className="live-dot w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
              LIVE
            </div>
          </div>
        </div>

        {/* Contact info bar */}
        <div
          className="flex items-center gap-2 px-4 py-2.5 text-xs"
          style={{ background: "oklch(0.49 0.263 281 / 8%)", borderBottom: "1px solid oklch(1 0 0 / 6%)" }}
        >
          <Phone className="w-3 h-3 flex-shrink-0" style={{ color: "oklch(0.68 0.22 281)" }} />
          <span style={{ color: "oklch(0.75 0.01 285)" }}>Calling</span>
          <span className="font-semibold text-white">Sarah Mitchell</span>
          <span style={{ color: "oklch(0.55 0.015 285)" }}>· +1 (555) 0192</span>
        </div>

        {/* Messages */}
        <div ref={messagesContainerRef} className="px-4 py-4 space-y-3 overflow-y-auto" style={{ minHeight: "220px", maxHeight: "260px" }}>
          {visibleMessages.map((idx) => {
            const msg = CONVERSATION[idx]
            const isAgent = msg.role === "agent"
            return (
              <div
                key={idx}
                className={`flex ${isAgent ? "justify-start" : "justify-end"}`}
                style={{ animation: "slide-up 0.3s ease-out forwards" }}
              >
                <div
                  className="max-w-[82%] px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed"
                  style={
                    isAgent
                      ? {
                          background: "oklch(1 0 0 / 10%)",
                          color: "oklch(0.9 0.005 285)",
                          borderTopLeftRadius: "4px",
                        }
                      : {
                          background: "linear-gradient(135deg, oklch(0.49 0.263 281 / 80%), oklch(0.58 0.24 300 / 80%))",
                          color: "white",
                          borderTopRightRadius: "4px",
                        }
                  }
                >
                  {isAgent && (
                    <span className="block text-[9px] font-semibold mb-1" style={{ color: "oklch(0.68 0.22 281)" }}>
                      Aria · AI Agent
                    </span>
                  )}
                  {msg.text}
                </div>
              </div>
            )
          })}

          {typing && (
            <div className={`flex ${CONVERSATION[visibleMessages.length]?.role === "agent" ? "justify-start" : "justify-end"}`}>
              <TypingDots />
            </div>
          )}

          {!callActive && (
            <div className="flex justify-center py-2">
              <span className="text-xs px-3 py-1 rounded-full" style={{ background: "oklch(1 0 0 / 6%)", color: "oklch(0.6 0.015 285)" }}>
                Connecting to Sarah...
              </span>
            </div>
          )}
        </div>

        {/* Bottom controls */}
        <div
          className="flex items-center justify-between px-4 py-3"
          style={{ borderTop: "1px solid oklch(1 0 0 / 8%)", background: "oklch(0.07 0.015 285 / 60%)" }}
        >
          <div className="flex items-center gap-2">
            <button
              className="w-9 h-9 rounded-xl flex items-center justify-center transition-all"
              style={{ background: "oklch(1 0 0 / 8%)", color: "oklch(0.7 0.01 285)" }}
            >
              <Volume2 className="w-4 h-4" />
            </button>
            <button
              className="w-9 h-9 rounded-xl flex items-center justify-center transition-all"
              style={{ background: "oklch(1 0 0 / 8%)", color: "oklch(0.7 0.01 285)" }}
            >
              <Mic className="w-4 h-4" />
            </button>
          </div>

          <div className="text-center">
            <p className="text-[10px] font-medium" style={{ color: "oklch(0.55 0.015 285)" }}>
              {agentSpeaking ? "AI Speaking..." : "Listening..."}
            </p>
          </div>

          <button
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: "oklch(0.55 0.215 15 / 80%)", color: "white" }}
          >
            <PhoneOff className="w-4 h-4" />
          </button>
        </div>

        {/* Campaign badge */}
        <div
          className="flex items-center justify-between px-4 py-2.5 text-[10px]"
          style={{ background: "oklch(0.49 0.263 281 / 6%)", borderTop: "1px solid oklch(0.49 0.263 281 / 15%)" }}
        >
          <span style={{ color: "oklch(0.55 0.015 285)" }}>Campaign: Enterprise Outreach Q1</span>
          <span className="font-semibold" style={{ color: "oklch(0.68 0.22 281)" }}>Call #1,847</span>
        </div>
      </div>
    </>
  )
}
