import type { Command } from '../types/Command.ts';
import { adventure } from './adventure.ts';
import { failed } from './failed.ts';
import { failedSucces } from './failedSucces.ts';
import { link } from './link.ts';
import { linkUser } from './linkUser.ts';
import { sabotage } from './sabotage.ts';
import { scoreboard } from './scoreboard.ts';
import { scoreboardPerso } from './scoreboardPerso.ts';
import { scoreboardSabotage } from './scoreboardSabotage.ts';
import { scoreboardSucces } from './scoreboardSucces.ts';
import { scoreboardSuccesPerso } from './scoreboardSuccesPerso.ts';
import { unfailed } from './unfailed.ts';
import { unfailedSucces } from './unfailedSucces.ts';
import { unsabotage } from './unsabotage.ts';

export const commandsForHelp: Command[] = [
  link,
  linkUser,
  failed,
  unfailed,
  failedSucces,
  unfailedSucces,
  sabotage,
  unsabotage,
  scoreboard,
  scoreboardPerso,
  scoreboardSucces,
  scoreboardSuccesPerso,
  scoreboardSabotage,
  adventure,
];
