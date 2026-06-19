import {
  integer,
  pgTable,
  primaryKey,
  serial,
  text,
  timestamp,
  unique,
} from 'drizzle-orm/pg-core';

export const userLinks = pgTable(
  'user_links',
  {
    id: serial('id').primaryKey(),
    guildId: text('guild_id').notNull(),
    discordId: text('discord_id').notNull(),
    dofusPseudo: text('dofus_pseudo').notNull(),
    linkedAt: timestamp('linked_at').defaultNow().notNull(),
  },
  (t) => [unique('uniq_guild_pseudo').on(t.guildId, t.dofusPseudo)],
);

export const failedChallenges = pgTable('failed_challenges', {
  id: serial('id').primaryKey(),
  guildId: text('guild_id').notNull(),
  dofusPseudo: text('dofus_pseudo').notNull(),
  challenge: text('challenge').notNull(),
  type: text('type').notNull().default('challenge'),
  recordedAt: timestamp('recorded_at').defaultNow().notNull(),
  recordedBy: text('recorded_by').notNull(),
});

export const adventures = pgTable(
  'adventures',
  {
    id: serial('id').primaryKey(),
    guildId: text('guild_id').notNull(),
    name: text('name').notNull(),
    createdBy: text('created_by').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (t) => [unique('uniq_guild_adventure_name').on(t.guildId, t.name)],
);

export const adventureMembers = pgTable(
  'adventure_members',
  {
    adventureId: integer('adventure_id')
      .notNull()
      .references(() => adventures.id, { onDelete: 'cascade' }),
    dofusPseudo: text('dofus_pseudo').notNull(),
  },
  (t) => [primaryKey({ columns: [t.adventureId, t.dofusPseudo] })],
);
