import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import Sidebar from '@/components/dashboard/Sidebar'
import { SearchProvider } from '@/components/dashboard/SearchContext'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session?.user) redirect('/signin')

  return (
    <SearchProvider>
      <div className="min-h-screen bg-light-bg">
        <Suspense>
          <Sidebar
            user={{
              name: session.user.name,
              email: session.user.email,
              image: session.user.image,
            }}
          />
        </Suspense>
        <main className="px-4 py-16 lg:ml-60 lg:px-8 lg:py-8">{children}</main>
      </div>
    </SearchProvider>
  )
}
