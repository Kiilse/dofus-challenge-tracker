import { REST, Routes } from 'discord.js';
import { commands } from '../src/commands/index.ts';
import { config } from '../src/config.ts';

const rest = new REST({ version: '10' }).setToken(config.discordToken);
const body = [...commands.values()].map((cmd) => cmd.data.toJSON());

// Global registration — covers all servers (propagates within ~1 hour)
await rest.put(Routes.applicationCommands(config.clientId), { body });
console.log(`✓ Registered ${body.length} global commands`);

// Per-guild registration — instant update for listed servers
for (const guildId of config.guildIds) {
  await rest.put(
    Routes.applicationGuildCommands(config.clientId, guildId),
    { body },
  );
  console.log(`✓ Registered ${body.length} commands to guild ${guildId}`);
}
