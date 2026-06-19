import {
  type ChatInputCommandInteraction,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  SlashCommandBuilder,
  MessageFlags,
  type MessageActionRowComponentBuilder,
} from 'discord.js';
import {
  getScoreboardPageByCharacter,
  getSaboteurScoreboardPage,
} from '../db/repositories/failedRepository.ts';
import { requireGuildId } from '../discord/requireGuild.ts';
import { rankingMedalForIndex, formatFailCount } from '../presentation/ranking.ts';
import { PAGE_SIZE } from '../presentation/scoreboardPagination.ts';
import { embedColors } from '../presentation/theme.ts';
import type { Command } from '../types/Command.ts';

type View = 'victimes' | 'saboteurs';

const VIEW_SELECT_ID = 'sabotage_view';
const PREV_BTN = 'sab_prev';
const NEXT_BTN = 'sab_next';

function buildSelectMenu(current: View): ActionRowBuilder<MessageActionRowComponentBuilder> {
  const menu = new StringSelectMenuBuilder()
    .setCustomId(VIEW_SELECT_ID)
    .setPlaceholder('Choisir la vue…')
    .addOptions(
      new StringSelectMenuOptionBuilder()
        .setLabel('🎯 Victimes les plus ciblées')
        .setValue('victimes')
        .setDescription('Qui a été le plus saboté')
        .setDefault(current === 'victimes'),
      new StringSelectMenuOptionBuilder()
        .setLabel('🗡️ Saboteurs les plus actifs')
        .setValue('saboteurs')
        .setDescription('Qui a le plus saboté')
        .setDefault(current === 'saboteurs'),
    );
  return new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(menu);
}

function buildNavRow(
  page: number,
  total: number,
): ActionRowBuilder<MessageActionRowComponentBuilder> | null {
  const totalPages = Math.ceil(total / PAGE_SIZE);
  if (totalPages <= 1) return null;

  const row = new ActionRowBuilder<MessageActionRowComponentBuilder>();

  if (page > 0) {
    row.addComponents(
      new ButtonBuilder()
        .setCustomId(`${PREV_BTN}_${page - 1}`)
        .setLabel('← Précédent')
        .setStyle(ButtonStyle.Secondary),
    );
  }
  if (page < totalPages - 1) {
    row.addComponents(
      new ButtonBuilder()
        .setCustomId(`${NEXT_BTN}_${page + 1}`)
        .setLabel('Suivant →')
        .setStyle(ButtonStyle.Primary),
    );
  }

  return row.components.length > 0 ? row : null;
}

async function buildEmbed(
  guildId: string,
  view: View,
  page: number,
): Promise<{ embed: EmbedBuilder; total: number }> {
  if (view === 'victimes') {
    const { rows, total } = await getScoreboardPageByCharacter(guildId, 'sabotage', page, PAGE_SIZE);
    const totalPages = Math.ceil(total / PAGE_SIZE);
    const offset = page * PAGE_SIZE;

    const embed = new EmbedBuilder()
      .setColor(embedColors.sabotageScoreboard)
      .setTitle('🎯 Classement — Victimes de sabotage')
      .setTimestamp();

    if (rows.length === 0) {
      embed.setDescription('Aucun sabotage enregistré.');
      return { embed, total };
    }

    const lines = rows.map((row, i) => {
      const medal = rankingMedalForIndex(offset + i);
      const mention = row.discordId ? ` (<@${row.discordId}>)` : ' *(non lié)*';
      return `${medal} **${row.dofusPseudo}**${mention} — ${formatFailCount(row.totalFails)} sabotage${row.totalFails > 1 ? 's' : ''}`;
    });

    embed.setDescription(lines.join('\n'));
    if (totalPages > 1) {
      embed.setFooter({ text: `Page ${page + 1} / ${totalPages} · ${total} personnages` });
    }

    return { embed, total };
  }

  // saboteurs view
  const { rows, total } = await getSaboteurScoreboardPage(guildId, page, PAGE_SIZE);
  const totalPages = Math.ceil(total / PAGE_SIZE);
  const offset = page * PAGE_SIZE;

  const embed = new EmbedBuilder()
    .setColor(embedColors.sabotageScoreboard)
    .setTitle('🗡️ Classement — Saboteurs les plus actifs')
    .setTimestamp();

  if (rows.length === 0) {
    embed.setDescription('Aucun saboteur enregistré.');
    return { embed, total };
  }

  const lines = rows.map((row, i) => {
    const medal = rankingMedalForIndex(offset + i);
    return `${medal} <@${row.discordId}> — **${row.totalSabotages}** sabotage${row.totalSabotages > 1 ? 's' : ''}`;
  });

  embed.setDescription(lines.join('\n'));
  if (totalPages > 1) {
    embed.setFooter({ text: `Page ${page + 1} / ${totalPages} · ${total} saboteurs` });
  }

  return { embed, total };
}

export const scoreboardSabotage: Command = {
  data: new SlashCommandBuilder()
    .setName('scoreboardsabotage')
    .setDescription('Tableau de bord des sabotages — victimes et saboteurs'),

  async execute(interaction: ChatInputCommandInteraction) {
    const guildId = await requireGuildId(interaction);
    if (guildId === undefined) return;

    if (!interaction.guild) {
      await interaction.reply({ content: 'Serveur introuvable.', flags: MessageFlags.Ephemeral });
      return;
    }

    await interaction.deferReply();

    let currentView: View = 'victimes';
    let currentPage = 0;

    const render = async () => {
      const { embed, total } = await buildEmbed(guildId, currentView, currentPage);
      const selectRow = buildSelectMenu(currentView);
      const navRow = buildNavRow(currentPage, total);
      const components = navRow ? [selectRow, navRow] : [selectRow];
      return { embed, components };
    };

    const { embed, components } = await render();
    const message = await interaction.editReply({ embeds: [embed], components });

    const collector = message.createMessageComponentCollector({
      filter: (i) => i.user.id === interaction.user.id,
      time: 5 * 60 * 1000,
    });

    collector.on('collect', async (i) => {
      if (i.customId === VIEW_SELECT_ID && i.isStringSelectMenu()) {
        currentView = i.values[0] as View;
        currentPage = 0;
      } else if (i.customId.startsWith(PREV_BTN) || i.customId.startsWith(NEXT_BTN)) {
        currentPage = Number(i.customId.split('_').at(-1));
      }

      const { embed: newEmbed, components: newComponents } = await render();
      await i.update({ embeds: [newEmbed], components: newComponents });
    });

    collector.on('end', async () => {
      await interaction.editReply({ components: [] }).catch(() => {});
    });
  },
};
