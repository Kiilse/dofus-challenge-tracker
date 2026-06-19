import {
  type ChatInputCommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
} from 'discord.js';
import { getSabotageTargetsForPseudo } from '../db/repositories/failedRepository.ts';
import { findByPseudo } from '../db/repositories/linkRepository.ts';
import { requireGuildId } from '../discord/requireGuild.ts';
import { embedColors } from '../presentation/theme.ts';
import type { Command } from '../types/Command.ts';

export const sabotagePerso: Command = {
  data: new SlashCommandBuilder()
    .setName('sabotageperso')
    .setDescription('Affiche toutes les cibles de sabotage liées à un personnage')
    .addStringOption((opt) =>
      opt
        .setName('pseudo')
        .setDescription('Pseudo Dofus du personnage')
        .setRequired(true),
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const guildId = await requireGuildId(interaction);
    if (guildId === undefined) return;

    const dofusPseudo = interaction.options.getString('pseudo', true).trim();

    const [targets, link] = await Promise.all([
      getSabotageTargetsForPseudo(guildId, dofusPseudo),
      findByPseudo(guildId, dofusPseudo),
    ]);

    const accountMention = link ? ` (<@${link.discordId}>)` : '';

    if (targets.length === 0) {
      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(embedColors.sabotage)
            .setTitle(`Sabotages de ${dofusPseudo}`)
            .setDescription(`Aucun sabotage enregistré pour **${dofusPseudo}**${accountMention}.`),
        ],
      });
      return;
    }

    const total = targets.reduce((sum, t) => sum + t.count, 0);

    const lines = targets.map((t, i) => {
      const countStr = t.count > 1 ? ` (×${t.count})` : '';
      return `**${i + 1}.** ${t.cible}${countStr}`;
    });

    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(embedColors.sabotage)
          .setTitle(`🗡️ Sabotages de ${dofusPseudo}${accountMention}`)
          .setDescription(lines.join('\n'))
          .setFooter({ text: `${targets.length} cible(s) distincte(s) • ${total} sabotage(s) au total` })
          .setTimestamp(),
      ],
    });
  },
};
