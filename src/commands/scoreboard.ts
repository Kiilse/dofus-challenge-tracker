import {
  type ChatInputCommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
} from 'discord.js';
import type { Guild } from 'discord.js';
import {
  type ScoreboardLinkedRow,
  type ScoreboardUnlinkedRow,
  getScoreboard,
} from '../db/repositories/failedRepository.ts';
import { requireGuildId } from '../discord/requireGuild.ts';
import {
  formatFailCount,
  rankingMedalForIndex,
  resolveMemberDisplayName,
} from '../presentation/ranking.ts';
import { embedColors } from '../presentation/theme.ts';
import type { Command } from '../types/Command.ts';

async function buildLinkedLines(
  guild: Guild,
  rows: ScoreboardLinkedRow[],
): Promise<string[]> {
  return Promise.all(
    rows.map(async (row, i) => {
      const medal = rankingMedalForIndex(i);
      const displayName = await resolveMemberDisplayName(guild, row.discordId);
      return `${medal} **${displayName}** — ${formatFailCount(row.totalFails)}`;
    }),
  );
}

function buildUnlinkedLines(rows: ScoreboardUnlinkedRow[]): string[] {
  return rows.map(
    (row) => `• **${row.dofusPseudo}** — ${formatFailCount(row.totalFails)}`,
  );
}

export const scoreboard: Command = {
  data: new SlashCommandBuilder()
    .setName('scoreboard')
    .setDescription(
      'Affiche le classement des challenges et succès ratés sur ce serveur',
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const guildId = await requireGuildId(interaction);
    if (guildId === undefined) return;

    const guild = interaction.guild;
    if (!guild) {
      await interaction.reply({
        content: 'Serveur introuvable.',
        ephemeral: true,
      });
      return;
    }

    await interaction.deferReply();

    const { challenges, successes } = await getScoreboard(guildId);

    const hasAnyData =
      challenges.linked.length > 0 ||
      challenges.unlinked.length > 0 ||
      successes.linked.length > 0 ||
      successes.unlinked.length > 0;

    const embed = new EmbedBuilder()
      .setColor(embedColors.scoreboard)
      .setTitle('🏆 Classement des échecs')
      .setTimestamp();

    if (!hasAnyData) {
      embed.setDescription('Aucun échec enregistré pour ce serveur.');
      await interaction.editReply({ embeds: [embed] });
      return;
    }

    // ── Challenges ──────────────────────────────────────────────────────────
    if (challenges.linked.length > 0) {
      const lines = await buildLinkedLines(guild, challenges.linked);
      embed.addFields({ name: '⚔️ Challenges ratés', value: lines.join('\n') });
    }
    if (challenges.unlinked.length > 0) {
      const lines = buildUnlinkedLines(challenges.unlinked);
      embed.addFields({
        name: '⚔️ Challenges ratés (non liés)',
        value: lines.join('\n'),
      });
    }

    // ── Succès ───────────────────────────────────────────────────────────────
    if (successes.linked.length > 0) {
      const lines = await buildLinkedLines(guild, successes.linked);
      embed.addFields({ name: '💀 Succès ratés', value: lines.join('\n') });
    }
    if (successes.unlinked.length > 0) {
      const lines = buildUnlinkedLines(successes.unlinked);
      embed.addFields({
        name: '💀 Succès ratés (non liés)',
        value: lines.join('\n'),
      });
    }

    await interaction.editReply({ embeds: [embed] });
  },
};
