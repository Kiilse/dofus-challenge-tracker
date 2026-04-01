import { SlashCommandBuilder, EmbedBuilder, type ChatInputCommandInteraction } from 'discord.js';
import type { Command } from '../types/Command.ts';
import { recordFailure } from '../db/repositories/failedRepository.ts';
import { findByPseudo } from '../db/repositories/linkRepository.ts';

/** Premier mot = pseudo Dofus ; la fin après « le challenge » = nom du challenge. */
const FAILED_PATTERN =
  /^(\S+)\s+a\s+fait\s+échouer\s+le\s+challenge\s+(.+)$/iu;

function parseFailedPhrase(raw: string): { pseudo: string; challenge: string } | null {
  const phrase = raw.trim().normalize('NFC');
  const match = FAILED_PATTERN.exec(phrase);
  if (!match) return null;
  const challenge = match[2].trim();
  if (!challenge) return null;
  return { pseudo: match[1], challenge };
}

export const failed = {
  data: new SlashCommandBuilder()
    .setName('failed')
    .setDescription('Enregistre un challenge raté à partir d’une phrase figée')
    .addStringOption((opt) =>
      opt
        .setName('phrase')
        .setDescription(
          'Pseudo-Dofus a fait échouer le challenge Nom-Du-Challenge',
        )
        .setRequired(true),
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const guildId = interaction.guildId!;
    const phrase = interaction.options.getString('phrase', true);

    const parsed = parseFailedPhrase(phrase);
    if (!parsed) {
      await interaction.reply({
        content:
          'Format invalide. Utilise exactement : `Pseudo-Dofus a fait échouer le challenge Nom-Du-Challenge` (le pseudo est le premier mot, le challenge est tout ce qui suit « le challenge »).',
        ephemeral: true,
      });
      return;
    }

    const { pseudo: dofusPseudo, challenge } = parsed;

    await recordFailure(guildId, dofusPseudo, challenge, interaction.user.id);

    const link = await findByPseudo(guildId, dofusPseudo);
    const accountMention = link ? ` (<@${link.discordId}>)` : '';

    const embed = new EmbedBuilder()
      .setColor(0xe74c3c)
      .setTitle('Challenge raté !')
      .setDescription(
        `**${dofusPseudo}**${accountMention} a fait échouer le challenge **${challenge}** !`,
      )
      .setFooter({ text: `Enregistré par ${interaction.user.username}` })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
} satisfies Command;
