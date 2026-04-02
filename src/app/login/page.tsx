'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

export default function LoginPage() {
  const router = useRouter()
  const [role, setRole] = useState<'admin' | 'client'>('admin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const providerId = role === 'admin' ? 'admin-login' : 'client-login'

    const result = await signIn(providerId, {
      email,
      password,
      redirect: false,
    })

    if (result?.error) {
      setError('Invalid email or password')
      setLoading(false)
      return
    }

    router.push(role === 'admin' ? '/analytics' : '/client/dashboard')
    router.refresh()
  }

  return (
    <Card className="w-full max-w-md shadow-none border">
      <CardHeader className="text-center pb-2">
        <div className="mx-auto w-10 h-10 rounded-lg bg-primary flex items-center justify-center mb-3">
          <Zap className="w-5 h-5 text-primary-foreground" fill="currentColor" />
        </div>
        <CardTitle className="text-xl">Sign in</CardTitle>
        <CardDescription>Access your voice campaign platform</CardDescription>
      </CardHeader>

      <CardContent>
        <div className="flex gap-2 mb-6">
          <Button
            type="button"
            variant={role === 'admin' ? 'default' : 'outline'}
            className="flex-1"
            onClick={() => setRole('admin')}
          >
            Admin
          </Button>
          <Button
            type="button"
            variant={role === 'client' ? 'default' : 'outline'}
            className="flex-1"
            onClick={() => setRole('client')}
          >
            Client
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder={role === 'admin' ? 'admin@voicecampaign.ai' : 'client@example.com'}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign in'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
