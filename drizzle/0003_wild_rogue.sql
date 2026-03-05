DROP INDEX "slides_deck_position_idx";--> statement-breakpoint
ALTER TABLE "decks" ADD COLUMN "is_favorite" boolean DEFAULT false NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "slides_deck_position_idx" ON "slides" USING btree ("deck_id","position");