import { redirect } from 'next/navigation'
import { and, eq, gte, isNull, count } from 'drizzle-orm'

import { auth } from '@/auth'
import { db } from '@/db'
import { users, decks } from '@/db/schema'
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
      subscriptionStatus: users.subscriptionStatus,
    })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1)

  if (!user) redirect('/signin')

  // Count decks created this month (non-deleted)
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const [deckCountRow] = await db
    .select({ value: count() })
    .from(decks)
    .where(
      and(
        eq(decks.userId, session.user.id),
        isNull(decks.deletedAt),
        gte(decks.createdAt, startOfMonth),
      ),
    )

  return (
    <SettingsClient
      user={{
        name: user.name ?? 'User',
        email: user.email,
        image: user.image ?? undefined,
      }}
      plan={user.subscriptionStatus as 'free' | 'pro' | 'cancelled'}
      decksThisMonth={deckCountRow?.value ?? 0}
    />
  )
}
