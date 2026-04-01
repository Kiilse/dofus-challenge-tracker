import { Collection } from 'discord.js';
import type { Command } from '../types/Command.ts';
import { link } from './link.ts';
import { failed } from './failed.ts';
import { scoreboard } from './scoreboard.ts';
import { adventure } from './adventure.ts';
import { help } from './help.ts';

export const commands = new Collection<string, Command>();

for (const cmd of [link, failed, scoreboard, adventure, help]) {
  commands.set(cmd.data.name, cmd);
}
