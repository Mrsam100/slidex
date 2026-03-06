'use client'

import { Suspense, useEffect, useState } from 'react'
import { signIn, useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { AlertCircle, ArrowLeft, Loader2, Presentation } from 'lucide-react'

const ERROR_MESSAGES: Record<string, string> = {
  OAuthSignin: 'Could not start sign-in. Please try again.',
  OAuthCallback: 'Sign-in was interrupted. Please try again.',
  OAuthAccountNotLinked: 'This email is already linked to another provider. Try a different sign-in method.',
  Callback: 'Something went wrong during sign-in. Please try again.',
  Default: 'An unexpected error occurred. Please try again.',
}

function SignInContent() {
  const { status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const error = searchParams.get('error')
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard'
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null)

  // Redirect already-authenticated users
  useEffect(() => {
    if (status === 'authenticated') {
      router.replace(callbackUrl)
    }
  }, [status, router, callbackUrl])

  // Show loading while checking session
  if (status === 'loading') {
    return (
      <main className="flex min-h-screen items-center justify-center bg-light-bg">
        <Loader2 className="h-6 w-6 animate-spin text-brand-blue" />
      </main>
    )
  }

  // Don't render sign-in UI if already authenticated
  if (status === 'authenticated') {
    return null
  }

  const errorMessage = error
    ? ERROR_MESSAGES[error] || ERROR_MESSAGES.Default
    : null

  function handleSignIn(provider: string) {
    setLoadingProvider(provider)
    signIn(provider, { callbackUrl })
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-light-bg">
      {/* Decorative background gradient */}
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[500px] w-[700px] -translate-x-1/2 rounded-full bg-brand-blue/[0.06] blur-[100px]" aria-hidden="true" />

      <div className="relative w-full max-w-sm px-4">
        {/* Back to home */}
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-grey transition-colors hover:text-dark"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to home
        </Link>

        <div className="w-full rounded-2xl bg-white p-8 shadow-xl shadow-black/[0.04] ring-1 ring-black/[0.06]">
          {/* Wordmark */}
          <div className="flex justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-blue shadow-lg shadow-brand-blue/25">
              <Presentation className="h-6 w-6 text-white" />
            </div>
          </div>
          <h1 className="mt-4 text-center text-2xl font-bold text-dark">
            Welcome to <span className="text-brand-blue">SlideX</span>
          </h1>
          <p className="mt-2 text-center text-sm text-grey">
            Sign in to create beautiful presentations
          </p>

          {/* Error banner */}
          {errorMessage && (
            <div className="mt-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-error" />
              <p className="text-sm text-error">{errorMessage}</p>
            </div>
          )}

          {/* Divider */}
          <div className="my-6 h-px bg-gray-200" />

          {/* OAuth buttons */}
          <div className="space-y-3">
            <button
              onClick={() => handleSignIn('google')}
              disabled={loadingProvider !== null}
              className="flex w-full items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3.5 text-sm font-medium text-dark shadow-sm transition-all hover:bg-gray-50 hover:shadow-md disabled:opacity-60"
            >
              {loadingProvider === 'google' ? (
                <Loader2 className="h-5 w-5 animate-spin text-grey" />
              ) : (
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
              )}
              Continue with Google
            </button>

            <button
              onClick={() => handleSignIn('github')}
              disabled={loadingProvider !== null}
              className="flex w-full items-center justify-center gap-3 rounded-xl bg-dark px-4 py-3.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-dark/90 hover:shadow-md disabled:opacity-60"
            >
              {loadingProvider === 'github' ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
              )}
              Continue with GitHub
            </button>
          </div>

          {/* Footer */}
          <p className="mt-6 text-center text-xs text-grey">
            Free to start · No credit card required
          </p>
        </div>
      </div>
    </main>
  )
}

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-light-bg">
          <Loader2 className="h-6 w-6 animate-spin text-brand-blue" />
        </main>
      }
    >
      <SignInContent />
    </Suspense>
  )
}
