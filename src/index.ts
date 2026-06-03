import { Client, GatewayIntentBits, REST, Routes } from 'discord.js';
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

// Register slash commands with Discord
const rest = new REST({ version: '10' }).setToken(config.discordToken);
const body = [...commands.values()].map((cmd) => cmd.data.toJSON());

console.log(`→ Registering ${body.length} slash commands...`);
try {
  if (config.guildIds.length > 0) {
    await rest.put(Routes.applicationCommands(config.clientId), { body: [] });
    for (const guildId of config.guildIds) {
      await rest.put(Routes.applicationGuildCommands(config.clientId, guildId), { body });
      console.log(`✓ Commands registered to guild ${guildId}`);
    }
  } else {
    await rest.put(Routes.applicationCommands(config.clientId), { body });
    console.log(`✓ ${body.length} global commands registered`);
  }
} catch (err) {
  console.error('✗ Failed to register commands:', err);
}

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once('clientReady', (c) => {
  console.log(`✓ Bot connecté en tant que ${c.user.tag}`);
});

registerInteractionHandler(client, commands);

await client.login(config.discordToken);
