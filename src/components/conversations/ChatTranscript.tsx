'use client'

import { useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { Phone } from 'lucide-react'

interface Message {
  role: 'agent' | 'user'
  text: string
}

function parseTranscript(transcript: string | null): Message[] {
  if (!transcript) return []
  return transcript.split('\n').filter(Boolean).map((line) => {
    const match = line.match(/^(agent|user):\s*(.+)$/i)
    if (match) return { role: match[1].toLowerCase() as 'agent' | 'user', text: match[2] }
    return { role: 'agent' as const, text: line }
  })
}

export { parseTranscript }

interface ChatTranscriptProps {
  messages: Message[]
  contactName: string | null
  agentName: string
  isEmpty: boolean
}

export function ChatTranscript({ messages, contactName, agentName, isEmpty }: ChatTranscriptProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  if (isEmpty) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <Phone className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Select a conversation to view</p>
        </div>
      </div>
    )
  }

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-sm text-muted-foreground">No transcript available</p>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-4">
      {messages.map((msg, i) => (
        <div key={i} className={cn('flex gap-2', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
          {msg.role === 'agent' && (
            <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-1">
              <Phone className="w-3 h-3 text-primary" />
            </div>
          )}
          <div className={cn(
            'max-w-[70%] rounded-2xl px-4 py-3 text-sm leading-relaxed',
            msg.role === 'user'
              ? 'bg-primary text-primary-foreground rounded-br-md'
              : 'bg-muted text-foreground rounded-bl-md'
          )}>
            {msg.text}
          </div>
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  )
}
