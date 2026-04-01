import type { Command } from '../types/Command.ts';
import { adventure } from './adventure.ts';
import { failed } from './failed.ts';
import { link } from './link.ts';
import { scoreboard } from './scoreboard.ts';

export const commandsForHelp: Command[] = [link, failed, scoreboard, adventure];
