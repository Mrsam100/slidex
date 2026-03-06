import NextAuth from 'next-auth'
import { DrizzleAdapter } from '@auth/drizzle-adapter'
import Google from 'next-auth/providers/google'
import GitHub from 'next-auth/providers/github'
import { db } from '@/db'
import { users, accounts, sessions, verificationTokens } from '@/db/schema'

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  providers: [Google, GitHub],
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/signin',
    error: '/signin',
  },
  callbacks: {
    jwt({ token, user }) {
      if (user?.id) {
        token.id = user.id
      }
      return token
    },
    session({ session, token }) {
      if (typeof token.id === 'string' && token.id.length > 0) {
        session.user.id = token.id
      }
      return session
    },
    authorized({ auth: session, request }) {
      const { pathname } = request.nextUrl
      const protectedRoutes = ['/dashboard', '/generate', '/deck', '/settings']
      const isProtected = protectedRoutes.some((r) => pathname.startsWith(r))

      if (isProtected && !session?.user) {
        return false // NextAuth redirects to signIn page
      }

      return true
    },
  },
})
