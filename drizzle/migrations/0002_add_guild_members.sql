CREATE TABLE "guild_members" (
  "id" serial PRIMARY KEY NOT NULL,
  "guild_id" text NOT NULL,
  "dofus_pseudo" text NOT NULL,
  "joined_at" timestamp NOT NULL,
  "recorded_by" text NOT NULL,
  "recorded_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "uniq_guild_member_pseudo" UNIQUE("guild_id","dofus_pseudo")
);
