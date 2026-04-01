CREATE TABLE "adventure_members" (
	"adventure_id" integer NOT NULL,
	"dofus_pseudo" text NOT NULL,
	CONSTRAINT "adventure_members_adventure_id_dofus_pseudo_pk" PRIMARY KEY("adventure_id","dofus_pseudo")
);
--> statement-breakpoint
CREATE TABLE "adventures" (
	"id" serial PRIMARY KEY NOT NULL,
	"guild_id" text NOT NULL,
	"name" text NOT NULL,
	"created_by" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "uniq_guild_adventure_name" UNIQUE("guild_id","name")
);
--> statement-breakpoint
CREATE TABLE "failed_challenges" (
	"id" serial PRIMARY KEY NOT NULL,
	"guild_id" text NOT NULL,
	"dofus_pseudo" text NOT NULL,
	"challenge" text NOT NULL,
	"recorded_at" timestamp DEFAULT now() NOT NULL,
	"recorded_by" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_links" (
	"id" serial PRIMARY KEY NOT NULL,
	"guild_id" text NOT NULL,
	"discord_id" text NOT NULL,
	"dofus_pseudo" text NOT NULL,
	"linked_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "uniq_guild_pseudo" UNIQUE("guild_id","dofus_pseudo")
);
--> statement-breakpoint
ALTER TABLE "adventure_members" ADD CONSTRAINT "adventure_members_adventure_id_adventures_id_fk" FOREIGN KEY ("adventure_id") REFERENCES "public"."adventures"("id") ON DELETE cascade ON UPDATE no action;