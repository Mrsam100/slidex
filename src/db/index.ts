import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as schema from './schema'

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set')
}

const sql = neon(process.env.DATABASE_URL)
export const db = drizzle(sql, { schema })

/** Run a DB operation with automatic retry for Neon cold starts */
export async function withRetry<T>(fn: () => Promise<T>, retries = 2): Promise<T> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn()
    } catch (err) {
      const isTimeout =
        err instanceof TypeError ||
        (err as { code?: string })?.code === 'UND_ERR_CONNECT_TIMEOUT' ||
        (err instanceof Error && err.message.includes('Connect Timeout'))
      if (isTimeout && attempt < retries) {
        await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)))
        continue
      }
      throw err
    }
  }
  throw new Error('withRetry: unreachable')
}
