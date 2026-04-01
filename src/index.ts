import { Client, GatewayIntentBits } from 'discord.js';
import { commands } from './commands/index.ts';
import { config } from './config.ts';
import { registerInteractionHandler } from './interactions/interactionCreate.ts';

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once('ready', (c) => {
  console.log(`✓ Bot connecté en tant que ${c.user.tag}`);
});

registerInteractionHandler(client, commands);

await client.login(config.discordToken);
