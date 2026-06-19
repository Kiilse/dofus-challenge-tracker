import type { Command } from '../types/Command.ts';
import { adventure } from './adventure.ts';
import { linkChannel } from './linkChannel.ts';
import { memberInfo } from './memberInfo.ts';
import { newMember } from './newMember.ts';
import { setMemberDate } from './setMemberDate.ts';
import { failed } from './failed.ts';
import { failedSucces } from './failedSucces.ts';
import { link } from './link.ts';
import { linkUser } from './linkUser.ts';
import { sabotage } from './sabotage.ts';
import { sabotagePerso } from './sabotagePerso.ts';
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
  sabotagePerso,
  unsabotage,
  scoreboard,
  scoreboardPerso,
  scoreboardSucces,
  scoreboardSuccesPerso,
  scoreboardSabotage,
  newMember,
  setMemberDate,
  adventure,
  linkChannel,
  memberInfo,
];
