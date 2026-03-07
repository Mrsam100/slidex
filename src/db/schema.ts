import { createId } from '@paralleldrive/cuid2'
import { relations } from 'drizzle-orm'
import {
  boolean,
  index,
  integer,
  json,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core'

// ── Users ──────────────────────────────────────────────
export const users = pgTable(
  'users',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => createId()),
    name: text('name'),
    email: text('email').notNull(),
    password: text('password'),
    emailVerified: timestamp('emailVerified', { mode: 'date' }),
    image: text('image'),
    stripeCustomerId: text('stripe_customer_id'),
    subscriptionStatus: text('subscription_status').default('free').notNull(),
    subscriptionId: text('subscription_id'),
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  },
  (t) => [uniqueIndex('users_email_idx').on(t.email)],
)

// ── Accounts (NextAuth) ────────────────────────────────
export const accounts = pgTable(
  'accounts',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => createId()),
    userId: text('userId')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: text('type').notNull(),
    provider: text('provider').notNull(),
    providerAccountId: text('providerAccountId').notNull(),
    refresh_token: text('refresh_token'),
    access_token: text('access_token'),
    expires_at: integer('expires_at'),
    token_type: text('token_type'),
    scope: text('scope'),
    id_token: text('id_token'),
    session_state: text('session_state'),
  },
  (t) => [
    uniqueIndex('accounts_provider_account_idx').on(
      t.provider,
      t.providerAccountId,
    ),
  ],
)

// ── Sessions (NextAuth) ────────────────────────────────
export const sessions = pgTable(
  'sessions',
  {
    sessionToken: text('sessionToken').primaryKey(),
    userId: text('userId')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    expires: timestamp('expires', { mode: 'date' }).notNull(),
  },
  (t) => [index('sessions_userId_idx').on(t.userId)],
)

// ── Verification Tokens (NextAuth) ────────────────────
export const verificationTokens = pgTable(
  'verification_tokens',
  {
    identifier: text('identifier').notNull(),
    token: text('token').notNull(),
    expires: timestamp('expires', { mode: 'date' }).notNull(),
  },
  (t) => [uniqueIndex('vt_identifier_token_idx').on(t.identifier, t.token)],
)

// ── Decks ──────────────────────────────────────────────
export const decks = pgTable(
  'decks',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => createId()),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    topic: text('topic'),
    slideCount: integer('slide_count').default(0).notNull(),
    theme: text('theme').default('minimal').notNull(),
    status: text('status').default('draft').notNull(),
    isPublic: boolean('is_public').default(false).notNull(),
    isFavorite: boolean('is_favorite').default(false).notNull(),
    deletedAt: timestamp('deleted_at', { mode: 'date' }),
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
  },
  (t) => [
    index('decks_user_deleted_created_idx').on(
      t.userId,
      t.deletedAt,
      t.createdAt,
    ),
  ],
)

// ── Slides ─────────────────────────────────────────────
export const slides = pgTable(
  'slides',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => createId()),
    deckId: text('deck_id')
      .notNull()
      .references(() => decks.id, { onDelete: 'cascade' }),
    position: integer('position').notNull(),
    layout: text('layout').notNull(),
    headline: text('headline'),
    body: text('body'),
    bullets: json('bullets').$type<string[]>(),
    leftColumn: json('left_column').$type<string[]>(),
    rightColumn: json('right_column').$type<string[]>(),
    quote: text('quote'),
    attribution: text('attribution'),
    speakerNotes: text('speaker_notes'),
    imagePrompt: text('image_prompt'),
    imageUrl: text('image_url'),
    chartData: json('chart_data'),
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex('slides_deck_position_idx').on(t.deckId, t.position),
  ],
)

// ── Relations ──────────────────────────────────────────
export const usersRelations = relations(users, ({ many }) => ({
  accounts: many(accounts),
  sessions: many(sessions),
  decks: many(decks),
}))

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, { fields: [accounts.userId], references: [users.id] }),
}))

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}))

export const decksRelations = relations(decks, ({ one, many }) => ({
  user: one(users, { fields: [decks.userId], references: [users.id] }),
  slides: many(slides),
}))

export const slidesRelations = relations(slides, ({ one }) => ({
  deck: one(decks, { fields: [slides.deckId], references: [decks.id] }),
}))
