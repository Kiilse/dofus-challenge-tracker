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

export const failedSucces: Command = {
  data: new SlashCommandBuilder()
    .setName('failedsucces')
    .setDescription('Enregistre un succès Dofus raté')
    .addStringOption((opt) =>
      opt
        .setName('pseudo')
        .setDescription('Pseudo Dofus du joueur')
        .setRequired(true),
    )
    .addStringOption((opt) =>
      opt
        .setName('succes')
        .setDescription('Nom du succès raté')
        .setRequired(true),
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const guildId = await requireGuildId(interaction);
    if (guildId === undefined) return;

    const dofusPseudo = interaction.options.getString('pseudo', true).trim();
    const succes = interaction.options.getString('succes', true).trim();

    await recordFailure(guildId, dofusPseudo, succes, interaction.user.id, 'succes');

    const link = await findByPseudo(guildId, dofusPseudo);
    const accountMention = link ? ` (<@${link.discordId}>)` : '';

    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(embedColors.failedSucces)
          .setTitle('Succès raté !')
          .setDescription(
            `**${dofusPseudo}**${accountMention} a raté le succès **${succes}** !`,
          )
          .setFooter({ text: `Enregistré par ${interaction.user.username}` })
          .setTimestamp(),
      ],
    });
  },
};
