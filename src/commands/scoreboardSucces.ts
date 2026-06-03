import {
  type ChatInputCommandInteraction,
  SlashCommandBuilder,
} from 'discord.js';
import { getScoreboardPage } from '../db/repositories/failedRepository.ts';
import { requireGuildId } from '../discord/requireGuild.ts';
import {
  PAGE_SIZE,
  buildPaginationRow,
  buildScoreboardEmbed,
} from '../presentation/scoreboardPagination.ts';
import { embedColors } from '../presentation/theme.ts';
import type { Command } from '../types/Command.ts';

export const scoreboardSucces: Command = {
  data: new SlashCommandBuilder()
    .setName('scoreboardsucces')
    .setDescription('Affiche le classement des succès ratés sur ce serveur'),

  async execute(interaction: ChatInputCommandInteraction) {
    const guildId = await requireGuildId(interaction);
    if (guildId === undefined) return;

    const guild = interaction.guild;
    if (!guild) {
      await interaction.reply({ content: 'Serveur introuvable.', ephemeral: true });
      return;
    }

    await interaction.deferReply();

    const showPage = async (page: number) => {
      const { rows, total } = await getScoreboardPage(guildId, 'succes', page, PAGE_SIZE);
      const embed = await buildScoreboardEmbed(
        guild, rows, page, total,
        '💀 Classement — Succès ratés',
        embedColors.failedSucces,
      );
      const paginationRow = buildPaginationRow(page, total);
      return { embed, components: paginationRow ? [paginationRow] : [] };
    };

    const { embed, components } = await showPage(0);
    const message = await interaction.editReply({ embeds: [embed], components });

    if (components.length === 0) return;

    const collector = message.createMessageComponentCollector({
      filter: (i) => i.user.id === interaction.user.id,
      time: 5 * 60 * 1000,
    });

    collector.on('collect', async (btn) => {
      const page = Number(btn.customId.split('_')[1]);
      const { embed: newEmbed, components: newComponents } = await showPage(page);
      await btn.update({ embeds: [newEmbed], components: newComponents });
    });

    collector.on('end', async () => {
      await interaction.editReply({ components: [] }).catch(() => {});
    });
  },
};
