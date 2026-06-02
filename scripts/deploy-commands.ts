import { REST, Routes } from 'discord.js';
import { commands } from '../src/commands/index.ts';
import { config } from '../src/config.ts';

const rest = new REST({ version: '10' }).setToken(config.discordToken);
const body = [...commands.values()].map((cmd) => cmd.data.toJSON());

if (config.guildIds.length > 0) {
  for (const guildId of config.guildIds) {
    await rest.put(
      Routes.applicationGuildCommands(config.clientId, guildId),
      { body },
    );
    console.log(`✓ Registered ${body.length} commands to guild ${guildId}`);
  }
} else {
  await rest.put(Routes.applicationCommands(config.clientId), { body });
  console.log(`✓ Registered ${body.length} global commands`);
}
