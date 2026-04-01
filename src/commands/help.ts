import {
  type ChatInputCommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
} from 'discord.js';
import { embedColors } from '../presentation/theme.ts';
import type { Command } from '../types/Command.ts';
import { buildHelpDescriptionLines } from './helpLines.ts';

export const help: Command = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Liste les commandes du bot et leur rôle'),

  async execute(interaction: ChatInputCommandInteraction) {
    const embed = new EmbedBuilder()
      .setColor(embedColors.help)
      .setTitle('Commandes du bot')
      .setDescription(buildHelpDescriptionLines().join('\n\n'));

    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
