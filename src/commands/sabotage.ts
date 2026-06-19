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

export const sabotage: Command = {
  data: new SlashCommandBuilder()
    .setName('sabotage')
    .setDescription('Enregistre un sabotage infligé à un joueur')
    .addStringOption((opt) =>
      opt
        .setName('pseudo')
        .setDescription('Pseudo Dofus de la victime')
        .setRequired(true),
    )
    .addStringOption((opt) =>
      opt
        .setName('cible')
        .setDescription('Description du sabotage (ex: Miss click sur combat Plongée dans un bain de sang)')
        .setRequired(true),
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const guildId = await requireGuildId(interaction);
    if (guildId === undefined) return;

    const dofusPseudo = interaction.options.getString('pseudo', true).trim();
    const cible = interaction.options.getString('cible', true).trim();

    await recordFailure(guildId, dofusPseudo, cible, interaction.user.id, 'sabotage');

    const link = await findByPseudo(guildId, dofusPseudo);
    const accountMention = link ? ` (<@${link.discordId}>)` : '';

    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(embedColors.sabotage)
          .setTitle('Sabotage enregistré ! 🗡️')
          .setDescription(
            `**${dofusPseudo}**${accountMention} s'est fait saboter **${cible}** par <@${interaction.user.id}> !`,
          )
          .setFooter({ text: `Enregistré par ${interaction.user.username}` })
          .setTimestamp(),
      ],
    });
  },
};
