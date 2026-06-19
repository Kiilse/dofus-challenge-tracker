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
  getScoreboardPage,
  getScoreboardPageByCharacter,
} from '../db/repositories/failedRepository.ts';
import { requireGuildId } from '../discord/requireGuild.ts';
import { rankingMedalForIndex, formatFailCount, resolveMemberDisplayName } from '../presentation/ranking.ts';
import { PAGE_SIZE } from '../presentation/scoreboardPagination.ts';
import { embedColors } from '../presentation/theme.ts';
import type { Command } from '../types/Command.ts';

type View = 'compte' | 'perso';

const VIEW_SELECT_ID = 'sabotage_view';
const PREV_BTN = 'sab_prev';
const NEXT_BTN = 'sab_next';

function buildSelectMenu(current: View): ActionRowBuilder<MessageActionRowComponentBuilder> {
  const menu = new StringSelectMenuBuilder()
    .setCustomId(VIEW_SELECT_ID)
    .setPlaceholder('Choisir la vue…')
    .addOptions(
      new StringSelectMenuOptionBuilder()
        .setLabel('🗡️ Par compte Discord')
        .setValue('compte')
        .setDescription('Sabotages groupés par compte Discord')
        .setDefault(current === 'compte'),
      new StringSelectMenuOptionBuilder()
        .setLabel('👤 Par personnage')
        .setValue('perso')
        .setDescription('Sabotages par personnage Dofus')
        .setDefault(current === 'perso'),
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

export const scoreboardSabotage: Command = {
  data: new SlashCommandBuilder()
    .setName('scoreboardsabotage')
    .setDescription('Classement des saboteurs — par compte ou par personnage'),

  async execute(interaction: ChatInputCommandInteraction) {
    const guildId = await requireGuildId(interaction);
    if (guildId === undefined) return;

    const guild = interaction.guild;
    if (!guild) {
      await interaction.reply({ content: 'Serveur introuvable.', flags: MessageFlags.Ephemeral });
      return;
    }

    await interaction.deferReply();

    let currentView: View = 'compte';
    let currentPage = 0;

    const render = async () => {
      const byCharacter = currentView === 'perso';
      const { rows, total } = byCharacter
        ? await getScoreboardPageByCharacter(guildId, 'sabotage', currentPage, PAGE_SIZE)
        : await getScoreboardPage(guildId, 'sabotage', currentPage, PAGE_SIZE);

      const totalPages = Math.ceil(total / PAGE_SIZE);
      const offset = currentPage * PAGE_SIZE;

      const embed = new EmbedBuilder()
        .setColor(embedColors.sabotageScoreboard)
        .setTitle(byCharacter ? '👤 Classement — Saboteurs (par personnage)' : '🗡️ Classement — Saboteurs (par compte)')
        .setTimestamp();

      if (rows.length === 0) {
        embed.setDescription('Aucun sabotage enregistré.');
      } else {
        const lines = await Promise.all(
          rows.map(async (row, i) => {
            const medal = rankingMedalForIndex(offset + i);
            const count = `**${row.totalFails}** sabotage${row.totalFails > 1 ? 's' : ''}`;
            if (byCharacter) {
              const mention = row.discordId ? ` (<@${row.discordId}>)` : ' *(non lié)*';
              return `${medal} **${row.dofusPseudo}**${mention} — ${count}`;
            }
            const name = row.discordId
              ? await resolveMemberDisplayName(guild, row.discordId)
              : row.dofusPseudo;
            const suffix = row.discordId ? '' : ' *(non lié)*';
            return `${medal} **${name}**${suffix} — ${count}`;
          }),
        );
        embed.setDescription(lines.join('\n'));
        if (totalPages > 1) {
          const unit = byCharacter ? 'personnages' : 'joueurs';
          embed.setFooter({ text: `Page ${currentPage + 1} / ${totalPages} · ${total} ${unit}` });
        }
      }

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
