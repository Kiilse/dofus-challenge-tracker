import {
  type ChatInputCommandInteraction,
  SlashCommandBuilder,
  MessageFlags,
} from 'discord.js';
import { getScoreboardPageByCharacter } from '../db/repositories/failedRepository.ts';
import { requireGuildId } from '../discord/requireGuild.ts';
import {
  PAGE_SIZE,
  buildPaginationRow,
  buildScoreboardEmbed,
} from '../presentation/scoreboardPagination.ts';
import { embedColors } from '../presentation/theme.ts';
import type { Command } from '../types/Command.ts';

export const scoreboardPerso: Command = {
  data: new SlashCommandBuilder()
    .setName('scoreboardperso')
    .setDescription('Affiche le classement des challenges ratés par personnage'),

  async execute(interaction: ChatInputCommandInteraction) {
    const guildId = await requireGuildId(interaction);
    if (guildId === undefined) return;

    const guild = interaction.guild;
    if (!guild) {
      await interaction.reply({ content: 'Serveur introuvable.', flags: MessageFlags.Ephemeral });
      return;
    }

    await interaction.deferReply();

    const showPage = async (page: number) => {
      const { rows, total } = await getScoreboardPageByCharacter(guildId, 'challenge', page, PAGE_SIZE);
      const embed = await buildScoreboardEmbed(
        guild, rows, page, total,
        '⚔️ Classement par personnage — Challenges ratés',
        embedColors.failed,
        true,
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
