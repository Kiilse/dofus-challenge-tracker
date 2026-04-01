import { SlashCommandBuilder, EmbedBuilder, type ChatInputCommandInteraction } from 'discord.js';
import type { Command } from '../types/Command.ts';
import { recordFailure } from '../db/repositories/failedRepository.ts';
import { findByPseudo } from '../db/repositories/linkRepository.ts';

export const failed: Command = {
  data: new SlashCommandBuilder()
    .setName('failed')
    .setDescription('Enregistre un challenge raté par un personnage')
    .addStringOption((opt) =>
      opt
        .setName('pseudo_dofus')
        .setDescription('Nom du personnage Dofus')
        .setRequired(true),
    )
    .addStringOption((opt) =>
      opt
        .setName('challenge')
        .setDescription('Nom du challenge raté')
        .setRequired(true),
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const guildId = interaction.guildId!;
    const dofusPseudo = interaction.options.getString('pseudo_dofus', true).trim();
    const challenge = interaction.options.getString('challenge', true).trim();

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
