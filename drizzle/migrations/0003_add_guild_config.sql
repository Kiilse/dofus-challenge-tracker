CREATE TABLE IF NOT EXISTS "guild_config" (
  "guild_id" text PRIMARY KEY NOT NULL,
  "reporting_channel_id" text NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

ALTER TABLE "guild_members"
  ADD COLUMN IF NOT EXISTS "anniversary_announced_at" timestamp;
