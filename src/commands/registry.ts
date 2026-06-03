import type { Command } from '../types/Command.ts';
import { adventure } from './adventure.ts';
import { failed } from './failed.ts';
import { failedSucces } from './failedSucces.ts';
import { link } from './link.ts';
import { linkUser } from './linkUser.ts';
import { scoreboard } from './scoreboard.ts';
import { scoreboardSucces } from './scoreboardSucces.ts';
import { unfailed } from './unfailed.ts';
import { unfailedSucces } from './unfailedSucces.ts';

export const commandsForHelp: Command[] = [
  link,
  linkUser,
  failed,
  unfailed,
  failedSucces,
  unfailedSucces,
  scoreboard,
  scoreboardSucces,
  adventure,
];
