import { Collection } from 'discord.js';
import type { Command } from '../types/Command.ts';
import { help } from './help.ts';
import { commandsForHelp } from './registry.ts';

export const commands = new Collection<string, Command>();

for (const cmd of [...commandsForHelp, help]) {
  commands.set(cmd.data.name, cmd);
}
