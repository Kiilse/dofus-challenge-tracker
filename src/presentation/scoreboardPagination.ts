import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  type Guild,
  type MessageActionRowComponentBuilder,
} from 'discord.js';
import type { ScoreboardRow } from '../db/repositories/failedRepository.ts';
import {
  formatFailCount,
  rankingMedalForIndex,
  resolveMemberDisplayName,
} from './ranking.ts';

export const PAGE_SIZE = 20;

export async function buildScoreboardEmbed(
  guild: Guild,
  rows: ScoreboardRow[],
  page: number,
  total: number,
  title: string,
  color: number,
): Promise<EmbedBuilder> {
  const totalPages = Math.ceil(total / PAGE_SIZE);
  const offset = page * PAGE_SIZE;

  const embed = new EmbedBuilder().setColor(color).setTitle(title).setTimestamp();

  if (rows.length === 0) {
    embed.setDescription('Aucun échec enregistré.');
    return embed;
  }

  const lines = await Promise.all(
    rows.map(async (row, i) => {
      const medal = rankingMedalForIndex(offset + i);
      const name = row.discordId
        ? await resolveMemberDisplayName(guild, row.discordId)
        : row.dofusPseudo;
      const suffix = row.discordId ? '' : ' *(non lié)*';
      return `${medal} **${name}**${suffix} — ${formatFailCount(row.totalFails)}`;
    }),
  );

  embed.setDescription(lines.join('\n'));

  if (totalPages > 1) {
    embed.setFooter({ text: `Page ${page + 1} / ${totalPages} · ${total} joueurs` });
  }

  return embed;
}

export function buildPaginationRow(
  page: number,
  total: number,
): ActionRowBuilder<MessageActionRowComponentBuilder> | null {
  const totalPages = Math.ceil(total / PAGE_SIZE);
  if (totalPages <= 1) return null;

  const row = new ActionRowBuilder<MessageActionRowComponentBuilder>();

  if (page > 0) {
    row.addComponents(
      new ButtonBuilder()
        .setCustomId(`page_${page - 1}`)
        .setLabel('← Précédent')
        .setStyle(ButtonStyle.Secondary),
    );
  }

  if (page < totalPages - 1) {
    row.addComponents(
      new ButtonBuilder()
        .setCustomId(`page_${page + 1}`)
        .setLabel('Suivant →')
        .setStyle(ButtonStyle.Primary),
    );
  }

  return row.components.length > 0 ? row : null;
}
