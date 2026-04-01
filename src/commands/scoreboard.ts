import {
  type ChatInputCommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
} from 'discord.js';
import { getScoreboard } from '../db/repositories/failedRepository.ts';
import { requireGuildId } from '../discord/requireGuild.ts';
import {
  formatFailCount,
  rankingMedalForIndex,
  resolveMemberDisplayName,
} from '../presentation/ranking.ts';
import { embedColors } from '../presentation/theme.ts';
import type { Command } from '../types/Command.ts';

export const scoreboard: Command = {
  data: new SlashCommandBuilder()
    .setName('scoreboard')
    .setDescription(
      'Affiche le classement des challenges ratés sur ce serveur',
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

    const { linked, unlinked } = await getScoreboard(guildId);

    const embed = new EmbedBuilder()
      .setColor(embedColors.scoreboard)
      .setTitle('🏆 Classement des challenges ratés')
      .setTimestamp();

    if (linked.length === 0 && unlinked.length === 0) {
      embed.setDescription('Aucun challenge raté enregistré pour ce serveur.');
      await interaction.editReply({ embeds: [embed] });
      return;
    }

    if (linked.length > 0) {
      const lines = await Promise.all(
        linked.map(async (row, i) => {
          const medal = rankingMedalForIndex(i);
          const displayName = await resolveMemberDisplayName(
            guild,
            row.discordId,
          );
          return `${medal} **${displayName}** — ${formatFailCount(row.totalFails)}`;
        }),
      );
      embed.addFields({ name: 'Comptes Discord', value: lines.join('\n') });
    }

    if (unlinked.length > 0) {
      const lines = unlinked.map(
        (row) =>
          `• **${row.dofusPseudo}** — ${formatFailCount(row.totalFails)}`,
      );
      embed.addFields({
        name: 'Personnages non liés',
        value: lines.join('\n'),
      });
    }

    await interaction.editReply({ embeds: [embed] });
  },
};
