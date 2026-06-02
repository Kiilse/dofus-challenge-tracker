import { Client, GatewayIntentBits } from 'discord.js';
import { sql } from 'drizzle-orm';
import { commands } from './commands/index.ts';
import { config } from './config.ts';
import { db } from './db/client.ts';
import { registerInteractionHandler } from './interactions/interactionCreate.ts';

// Idempotent guard: ensures the `type` column exists even if drizzle-kit migration was skipped
await db.execute(sql`
  ALTER TABLE failed_challenges
  ADD COLUMN IF NOT EXISTS "type" text NOT NULL DEFAULT 'challenge'
`);

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once('clientReady', (c) => {
  console.log(`✓ Bot connecté en tant que ${c.user.tag}`);
});

registerInteractionHandler(client, commands);

await client.login(config.discordToken);
