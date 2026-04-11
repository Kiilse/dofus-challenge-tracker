import { Collection } from 'discord.js';
import type { Command } from '../types/Command.ts';
import { help } from './help.ts';
import { commandsForHelp } from './registry.ts';
import { unfailed } from './unfailed.ts';

export const commands = new Collection<string, Command>();

for (const cmd of [...commandsForHelp, unfailed, help]) {
  commands.set(cmd.data.name, cmd);
}
