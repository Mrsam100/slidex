import { NextResponse } from 'next/server'
import { auth } from '@/auth'

export const dynamic = 'force-dynamic'

const MAX_SIZE = 4 * 1024 * 1024 // 4 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

/**
 * POST /api/upload — Upload an image for slide use.
 * Uses Vercel Blob if BLOB_READ_WRITE_TOKEN is set, otherwise stores as data URL.
 */
export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const formData = await req.formData()
  const file = formData.get('file')

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: 'Invalid file type. Use JPEG, PNG, WebP, or GIF.' }, { status: 400 })
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'File too large. Maximum 4 MB.' }, { status: 400 })
  }

  // Try Vercel Blob first (production)
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      const { put } = await import('@vercel/blob')
      const blob = await put(`slides/${session.user.id}/${Date.now()}-${file.name}`, file, {
        access: 'public',
      })
      return NextResponse.json({ url: blob.url })
    } catch {
      return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
    }
  }

  // Fallback: convert to data URL (dev / no blob configured)
  const buffer = await file.arrayBuffer()
  const base64 = Buffer.from(buffer).toString('base64')
  const dataUrl = `data:${file.type};base64,${base64}`

  return NextResponse.json({ url: dataUrl })
}
