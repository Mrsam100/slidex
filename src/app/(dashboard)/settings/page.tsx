import { redirect } from 'next/navigation'
import { eq } from 'drizzle-orm'

import { auth } from '@/auth'
import { db } from '@/db'
import { users } from '@/db/schema'
import SettingsClient from './SettingsClient'

export const metadata = { title: 'Settings — SlideX' }

export default async function SettingsPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/signin')

  const [user] = await db
    .select({
      name: users.name,
      email: users.email,
      image: users.image,
    })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1)

  if (!user) redirect('/signin')

  return (
    <SettingsClient
      user={{
        name: user.name ?? 'User',
        email: user.email,
        image: user.image ?? undefined,
      }}
    />
  )
}
