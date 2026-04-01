import { SlashCommandBuilder, EmbedBuilder, type ChatInputCommandInteraction } from 'discord.js';
import type { Command } from '../types/Command.ts';
import { getScoreboard } from '../db/repositories/failedRepository.ts';

const MEDALS = ['🥇', '🥈', '🥉'];

export const scoreboard: Command = {
  data: new SlashCommandBuilder()
    .setName('scoreboard')
    .setDescription('Affiche le classement des challenges ratés sur ce serveur'),

  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();

    const guildId = interaction.guildId!;
    const { linked, unlinked } = await getScoreboard(guildId);

    const embed = new EmbedBuilder()
      .setColor(0xf39c12)
      .setTitle('🏆 Classement des challenges ratés')
      .setTimestamp();

    if (linked.length === 0 && (!unlinked || (unlinked as unknown[]).length === 0)) {
      embed.setDescription('Aucun challenge raté enregistré pour ce serveur.');
      await interaction.editReply({ embeds: [embed] });
      return;
    }

    // Linked accounts section
    if (linked.length > 0) {
      const lines = await Promise.all(
        linked.map(async (row, i) => {
          const medal = MEDALS[i] ?? `${i + 1}.`;
          let name: string;
          try {
            const member = await interaction.guild!.members.fetch(row.discordId);
            name = member.displayName;
          } catch {
            name = `<@${row.discordId}>`;
          }
          return `${medal} **${name}** — ${row.totalFails} fail${Number(row.totalFails) !== 1 ? 's' : ''}`;
        }),
      );
      embed.addFields({ name: 'Comptes Discord', value: lines.join('\n') });
    }

    // Unlinked characters section
    const unlinkedRows = unlinked as { dofus_pseudo: string; total_fails: number }[];
    if (unlinkedRows.length > 0) {
      const lines = unlinkedRows.map(
        (row) => `• **${row.dofus_pseudo}** — ${row.total_fails} fail${row.total_fails !== 1 ? 's' : ''}`,
      );
      embed.addFields({ name: 'Personnages non liés', value: lines.join('\n') });
    }

    await interaction.editReply({ embeds: [embed] });
  },
};
