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
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [debugLog, setDebugLog] = useState<string[]>([])
  const [showDebug, setShowDebug] = useState(false)

  function log(msg: string) {
    setDebugLog((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`])
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setDebugLog([])
    setLoading(true)
    setShowDebug(true)

    try {
      // Step 1: Direct DB test
      log('Testing DB connection and credentials...')
      const testRes = await fetch('/api/debug/auth-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const testData = await testRes.json()
      for (const step of testData.steps || []) {
        log(`${step.step}: ${step.status}${step.ms ? ` (${step.ms}ms)` : ''}${step.detail ? ` — ${JSON.stringify(step.detail)}` : ''}`)
      }

      // Step 2: Try admin login via NextAuth
      log('Calling signIn("admin-login")...')
      const adminStart = Date.now()
      const adminResult = await signIn('admin-login', {
        email,
        password,
        redirect: false,
      })
      log(`admin-login result (${Date.now() - adminStart}ms): ${JSON.stringify(adminResult)}`)

      if (adminResult && !adminResult.error) {
        log('Admin login SUCCESS — redirecting to /analytics')
        router.push('/analytics')
        router.refresh()
        return
      }

      // Step 3: Try client login via NextAuth
      log('Calling signIn("client-login")...')
      const clientStart = Date.now()
      const clientResult = await signIn('client-login', {
        email,
        password,
        redirect: false,
      })
      log(`client-login result (${Date.now() - clientStart}ms): ${JSON.stringify(clientResult)}`)

      if (clientResult && !clientResult.error) {
        log('Client login SUCCESS — redirecting to /client/dashboard')
        router.push('/client/dashboard')
        router.refresh()
        return
      }

      log('Both logins failed')
      setError('Invalid email or password')
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      log(`EXCEPTION: ${msg}`)
      setError(`Login failed: ${msg}`)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-4">
        <Card className="shadow-none border">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto w-10 h-10 rounded-lg bg-primary flex items-center justify-center mb-3">
              <Zap className="w-5 h-5 text-primary-foreground" fill="currentColor" />
            </div>
            <CardTitle className="text-xl">Sign in</CardTitle>
            <CardDescription>Access your dashboard</CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
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

        {showDebug && debugLog.length > 0 && (
          <Card className="shadow-none border">
            <CardContent className="pt-4">
              <p className="text-xs font-semibold text-muted-foreground mb-2">Debug Log</p>
              <pre className="text-xs bg-muted p-3 rounded-lg overflow-auto max-h-80 whitespace-pre-wrap break-all">
                {debugLog.join('\n')}
              </pre>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
