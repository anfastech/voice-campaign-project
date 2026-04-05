import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      id: 'admin-login',
      name: 'Admin',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        try {
          console.log('[AUTH] admin-login attempt:', credentials?.email)
          if (!credentials?.email || !credentials?.password) {
            console.log('[AUTH] admin-login: missing credentials')
            return null
          }

          const user = await prisma.user.findUnique({
            where: { email: credentials.email as string },
          })
          console.log('[AUTH] admin-login: user found?', !!user, user?.email)
          if (!user?.password) return null

          const valid = await bcrypt.compare(credentials.password as string, user.password)
          console.log('[AUTH] admin-login: password valid?', valid)
          if (!valid) return null

          return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: 'admin' as const,
          }
        } catch (err) {
          console.error('[AUTH] admin-login ERROR:', err)
          return null
        }
      },
    }),
    Credentials({
      id: 'client-login',
      name: 'Client',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        try {
          console.log('[AUTH] client-login attempt:', credentials?.email)
          if (!credentials?.email || !credentials?.password) {
            console.log('[AUTH] client-login: missing credentials')
            return null
          }

          const client = await prisma.client.findUnique({
            where: { email: credentials.email as string },
          })
          console.log('[AUTH] client-login: client found?', !!client)
          if (!client || !client.isActive) return null

          const valid = await bcrypt.compare(credentials.password as string, client.passwordHash)
          console.log('[AUTH] client-login: password valid?', valid)
          if (!valid) return null

          return {
            id: client.id,
            name: client.name,
            email: client.email,
            role: 'client' as const,
            adminUserId: client.userId,
          }
        } catch (err) {
          console.error('[AUTH] client-login ERROR:', err)
          return null
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role
        token.userId = user.id
        if ((user as any).adminUserId) {
          token.adminUserId = (user as any).adminUserId
        }
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.userId as string
        (session.user as any).role = token.role as string
        if (token.adminUserId) {
          (session.user as any).adminUserId = token.adminUserId as string
        }
      }
      return session
    },
  },
  pages: {
    signIn: '/login', // Client login — admin uses /admin
  },
  session: { strategy: 'jwt' },
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || 'dev-secret-change-in-production',
  trustHost: true,
  debug: true,
})
