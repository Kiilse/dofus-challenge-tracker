import {
  type ChatInputCommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
} from 'discord.js';
import { recordFailure } from '../db/repositories/failedRepository.ts';
import { findByPseudo } from '../db/repositories/linkRepository.ts';
import { requireGuildId } from '../discord/requireGuild.ts';
import { embedColors } from '../presentation/theme.ts';
import type { Command } from '../types/Command.ts';

const FAILED_PATTERN = /^(\S+)\s+a\s+fait\s+échouer\s+le\s+challenge\s+(.+)$/iu;

export function parseFailedPhrase(
  raw: string,
): { pseudo: string; challenge: string } | null {
  const phrase = raw.trim().normalize('NFC');
  const match = FAILED_PATTERN.exec(phrase);
  if (!match) return null;
  const challenge = match[2].trim();
  if (!challenge) return null;
  return { pseudo: match[1], challenge };
}

export const failed: Command = {
  data: new SlashCommandBuilder()
    .setName('failed')
    .setDescription('Enregistre un challenge raté')
    .addStringOption((opt) =>
      opt
        .setName('phrase')
        .setDescription('Pseudo-Dofus a fait échouer le challenge Nom-Du-Challenge')
        .setRequired(true),
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const guildId = await requireGuildId(interaction);
    if (guildId === undefined) return;

    const phrase = interaction.options.getString('phrase', true);
    const parsed = parseFailedPhrase(phrase);
    if (!parsed) {
      await interaction.reply({
        content:
          'Format invalide. Utilise : `Pseudo-Dofus a fait échouer le challenge Nom-Du-Challenge`',
        ephemeral: true,
      });
      return;
    }

    const { pseudo: dofusPseudo, challenge } = parsed;
    await recordFailure(guildId, dofusPseudo, challenge, interaction.user.id, 'challenge');

    const link = await findByPseudo(guildId, dofusPseudo);
    const accountMention = link ? ` (<@${link.discordId}>)` : '';

    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(embedColors.failed)
          .setTitle('Challenge raté !')
          .setDescription(
            `**${dofusPseudo}**${accountMention} a fait échouer le challenge **${challenge}** !`,
          )
          .setFooter({ text: `Enregistré par ${interaction.user.username}` })
          .setTimestamp(),
      ],
    });
  },
};
