import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '@/db'
import { users } from '@/db/schema'

const signupSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(100),
})

export async function POST(req: Request) {
  try {
  const body = await req.json()
  const parsed = signupSchema.safeParse(body)

  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? 'Invalid input'
    return NextResponse.json({ error: firstError }, { status: 400 })
  }

  const { name, email, password } = parsed.data

  // Check if user already exists
  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .then((res) => res[0])

  if (existing) {
    return NextResponse.json(
      { error: 'An account with this email already exists' },
      { status: 409 },
    )
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 12)

  // Create user
  const newUser = await db
    .insert(users)
    .values({
      name,
      email,
      password: hashedPassword,
    })
    .returning({ id: users.id })
    .then((res) => res[0])

  if (!newUser) {
    return NextResponse.json(
      { error: 'Failed to create account' },
      { status: 500 },
    )
  }

  return NextResponse.json({ success: true }, { status: 201 })
  } catch {
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 },
    )
  }
}
