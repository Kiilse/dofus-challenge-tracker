import { Client, GatewayIntentBits, REST, Routes } from 'discord.js';
import { sql } from 'drizzle-orm';
import { commands } from './commands/index.ts';
import { config } from './config.ts';
import { db } from './db/client.ts';
import { registerInteractionHandler } from './interactions/interactionCreate.ts';
import { startAnniversaryScheduler } from './scheduler/anniversaryScheduler.ts';

// Idempotent guard: ensures the `type` column exists even if drizzle-kit migration was skipped
await db.execute(sql`
  ALTER TABLE failed_challenges
  ADD COLUMN IF NOT EXISTS "type" text NOT NULL DEFAULT 'challenge'
`);

// Idempotent guard: guild_config table and anniversary column
await db.execute(sql`
  CREATE TABLE IF NOT EXISTS "guild_config" (
    "guild_id" text PRIMARY KEY NOT NULL,
    "reporting_channel_id" text NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL
  )
`);
await db.execute(sql`
  ALTER TABLE guild_members
  ADD COLUMN IF NOT EXISTS "anniversary_announced_at" timestamp
`);

// Register slash commands with Discord
const rest = new REST({ version: '10' }).setToken(config.discordToken);
const body = [...commands.values()].map((cmd) => cmd.data.toJSON());

console.log(`→ Registering ${body.length} slash commands...`);
try {
  // Always clear global commands first
  await rest.put(Routes.applicationCommands(config.clientId), { body: config.guildIds.length > 0 ? [] : body });

  if (config.guildIds.length > 0) {
    console.log('✓ Global commands cleared');
    for (const guildId of config.guildIds) {
      await rest.put(Routes.applicationGuildCommands(config.clientId, guildId), { body });
      console.log(`✓ Commands registered to guild ${guildId}`);
    }
  } else {
    console.log(`✓ ${body.length} global commands registered`);
  }
} catch (err) {
  console.error('✗ Failed to register commands:', err);
}

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once('clientReady', (c) => {
  console.log(`✓ Bot connecté en tant que ${c.user.tag}`);
  startAnniversaryScheduler(c);
});

registerInteractionHandler(client, commands);

await client.login(config.discordToken);
