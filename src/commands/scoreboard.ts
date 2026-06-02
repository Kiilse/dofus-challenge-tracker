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

async function buildScoreboardEmbed(
  guild: Guild,
  linked: ScoreboardLinkedRow[],
  unlinked: ScoreboardUnlinkedRow[],
  title: string,
  color: number,
): Promise<EmbedBuilder> {
  const embed = new EmbedBuilder().setColor(color).setTitle(title).setTimestamp();

  if (linked.length === 0 && unlinked.length === 0) {
    embed.setDescription('Aucun échec enregistré.');
    return embed;
  }

  if (linked.length > 0) {
    const lines = await buildLinkedLines(guild, linked);
    embed.addFields({ name: 'Comptes liés', value: lines.join('\n') });
  }
  if (unlinked.length > 0) {
    const lines = buildUnlinkedLines(unlinked);
    embed.addFields({ name: 'Non liés', value: lines.join('\n') });
  }

  return embed;
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

    const [challengesEmbed, succesEmbed] = await Promise.all([
      buildScoreboardEmbed(
        guild,
        challenges.linked,
        challenges.unlinked,
        '⚔️ Classement — Challenges ratés',
        embedColors.failed,
      ),
      buildScoreboardEmbed(
        guild,
        successes.linked,
        successes.unlinked,
        '💀 Classement — Succès ratés',
        embedColors.failedSucces,
      ),
    ]);

    await interaction.editReply({ embeds: [challengesEmbed, succesEmbed] });
  },
};
