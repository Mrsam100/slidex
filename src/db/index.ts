import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as schema from './schema'

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set')
}

// Custom fetch with automatic retry for Neon cold starts
const fetchWithRetry: typeof fetch = async (input, init) => {
  let lastError: unknown
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await fetch(input, init)
    } catch (err) {
      lastError = err
      // Only retry on connection/timeout errors
      if (err instanceof TypeError || (err as { code?: string })?.code === 'UND_ERR_CONNECT_TIMEOUT') {
        await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)))
        continue
      }
      throw err
    }
  }
  throw lastError
}

const sql = neon(process.env.DATABASE_URL, {
  fetchOptions: {
    cache: 'no-store' as const,
  },
  fetchFunction: fetchWithRetry,
})
export const db = drizzle(sql, { schema })
