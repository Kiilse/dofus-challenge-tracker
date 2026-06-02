import type { Command } from '../types/Command.ts';
import { adventure } from './adventure.ts';
import { failed } from './failed.ts';
import { failedSucces } from './failedSucces.ts';
import { link } from './link.ts';
import { scoreboard } from './scoreboard.ts';
import { unfailed } from './unfailed.ts';
import { unfailedSucces } from './unfailedSucces.ts';

export const commandsForHelp: Command[] = [
  link,
  failed,
  unfailed,
  failedSucces,
  unfailedSucces,
  scoreboard,
  adventure,
];
