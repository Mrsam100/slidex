import NextAuth from 'next-auth'
import { DrizzleAdapter } from '@auth/drizzle-adapter'
import Credentials from 'next-auth/providers/credentials'
import Google from 'next-auth/providers/google'
import GitHub from 'next-auth/providers/github'
import bcrypt from 'bcryptjs'
import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { users, accounts, sessions, verificationTokens } from '@/db/schema'

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  providers: [
    Google,
    GitHub,
    Credentials({
      name: 'Email',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const email = credentials?.email as string | undefined
        const password = credentials?.password as string | undefined

        if (!email || !password) return null

        const user = await db
          .select()
          .from(users)
          .where(eq(users.email, email))
          .then((res) => res[0])

        if (!user || !user.password) return null

        const isValid = await bcrypt.compare(password, user.password)
        if (!isValid) return null

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        }
      },
    }),
  ],
  session: { strategy: 'jwt', maxAge: 30 * 24 * 60 * 60 },
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
        return false
      }

      // Redirect authenticated users from landing/signin/signup to dashboard
      const publicOnlyRoutes = ['/', '/signin', '/signup']
      if (session?.user && publicOnlyRoutes.includes(pathname)) {
        return Response.redirect(new URL('/dashboard', request.url))
      }

      return true
    },
  },
})
