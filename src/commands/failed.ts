import { SlashCommandBuilder, EmbedBuilder, type ChatInputCommandInteraction } from 'discord.js';
import type { Command } from '../types/Command.ts';
import { recordFailure } from '../db/repositories/failedRepository.ts';
import { findByPseudo } from '../db/repositories/linkRepository.ts';

const FAILED_PATTERN = /^(\S+) a fait échouer le challenge (.+)$/i;

export const failed: Command = {
  data: new SlashCommandBuilder()
    .setName('failed')
    .setDescription('Enregistre un challenge raté')
    .addStringOption((opt) =>
      opt
        .setName('phrase')
        .setDescription('Ex : Pseudo-Dofus a fait échouer le challenge Nom-Du-Challenge')
        .setRequired(true),
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const guildId = interaction.guildId!;
    const phrase = interaction.options.getString('phrase', true).trim();

    const match = FAILED_PATTERN.exec(phrase);
    if (!match) {
      await interaction.reply({
        content:
          'Format invalide. Utilise : `Pseudo-Dofus a fait échouer le challenge Nom-Du-Challenge`',
        ephemeral: true,
      });
      return;
    }

    const dofusPseudo = match[1];
    const challenge = match[2].trim();

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
};
