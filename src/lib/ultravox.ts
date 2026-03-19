import axios, { AxiosError } from 'axios'

const ultravoxClient = axios.create({
  baseURL: process.env.ULTRAVOX_BASE_URL || 'https://api.ultravox.ai/api',
  headers: {
    'X-API-Key': process.env.ULTRAVOX_API_KEY,
    'Content-Type': 'application/json',
  },
})

export interface UltravoxCallConfig {
  systemPrompt: string
  voice?: string
  temperature?: number
  maxDuration?: number
}

export interface UltravoxCall {
  callId: string
  clientSecret?: string
  joinUrl?: string
  status?: string
  created?: string
  ended?: string
  endReason?: string
  transcript?: string
  recordingUrl?: string
  summary?: string
  durationSeconds?: number
  costCents?: number
}

export class UltravoxService {
  async createCall(config: UltravoxCallConfig): Promise<UltravoxCall> {
    try {
      const response = await ultravoxClient.post('/calls', {
        systemPrompt: config.systemPrompt,
        voice: config.voice || 'Mark',
        temperature: config.temperature ?? 0.7,
        maxDuration: `${config.maxDuration || 300}s`,
        model: 'fixie-ai/ultravox-70B',
      })
      return response.data
    } catch (error) {
      const err = error as AxiosError
      console.error('Ultravox createCall error:', err.response?.data || err.message)
      throw error
    }
  }

  async getCall(callId: string): Promise<UltravoxCall> {
    const response = await ultravoxClient.get(`/calls/${callId}`)
    return response.data
  }

  async listCalls(): Promise<{ results: UltravoxCall[] }> {
    const response = await ultravoxClient.get('/calls')
    return response.data
  }

  async deleteCall(callId: string): Promise<void> {
    await ultravoxClient.delete(`/calls/${callId}`)
  }

  async getCallMessages(callId: string) {
    const response = await ultravoxClient.get(`/calls/${callId}/messages`)
    return response.data
  }
}

export const ultravox = new UltravoxService()
