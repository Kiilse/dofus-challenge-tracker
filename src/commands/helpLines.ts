import { ApplicationCommandOptionType } from 'discord.js';
import type { Command } from '../types/Command.ts';
import { commandsForHelp } from './registry.ts';

function linesForCommand(cmd: Command): string[] {
  const json = cmd.data.toJSON();
  const name = json.name;
  const desc = json.description ?? '';
  const head = `\`/${name}\` — ${desc}`;
  const opts = json.options;
  if (!opts?.length) return [head];

  const out: string[] = [head];
  for (const o of opts) {
    if (o.type === ApplicationCommandOptionType.Subcommand) {
      out.push(`  • \`/${name} ${o.name}\` — ${o.description}`);
    } else if (o.type === ApplicationCommandOptionType.SubcommandGroup) {
      for (const inner of o.options ?? []) {
        if (inner.type === ApplicationCommandOptionType.Subcommand) {
          out.push(
            `  • \`/${name} ${o.name} ${inner.name}\` — ${inner.description}`,
          );
        }
      }
    }
  }
  return out;
}

export function buildHelpDescriptionLines(): string[] {
  const parts = commandsForHelp.flatMap(linesForCommand);
  parts.push('`/help` — Liste les commandes du bot et leur rôle');
  return parts;
}
