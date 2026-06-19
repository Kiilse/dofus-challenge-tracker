import {
  type ChatInputCommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
} from 'discord.js';
import { recordFailure } from '../db/repositories/failedRepository.ts';
import { findByPseudo } from '../db/repositories/linkRepository.ts';
import { requireGuildId } from '../discord/requireGuild.ts';
import { embedColors } from '../presentation/theme.ts';
import type { Command } from '../types/Command.ts';

export const sabotage: Command = {
  data: new SlashCommandBuilder()
    .setName('sabotage')
    .setDescription('Enregistre un sabotage infligé à un joueur')
    .addStringOption((opt) =>
      opt
        .setName('pseudo')
        .setDescription('Pseudo Dofus du saboteur')
        .setRequired(true),
    )
    .addStringOption((opt) =>
      opt
        .setName('intitule')
        .setDescription('Intitulé du sabotage (ex: Miss click sur combat Plongée dans un bain de sang)')
        .setRequired(true),
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const guildId = await requireGuildId(interaction);
    if (guildId === undefined) return;

    const dofusPseudo = interaction.options.getString('pseudo', true).trim();
    const intitule = interaction.options.getString('intitule', true).trim();

    await recordFailure(guildId, dofusPseudo, intitule, interaction.user.id, 'sabotage');

    const link = await findByPseudo(guildId, dofusPseudo);
    const accountMention = link ? ` (<@${link.discordId}>)` : '';

    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(embedColors.sabotage)
          .setTitle('Sabotage enregistré ! 🗡️')
          .setDescription(
            `**${dofusPseudo}**${accountMention} a saboté : **${intitule}** !`,
          )
          .setFooter({ text: `Enregistré par ${interaction.user.username}` })
          .setTimestamp(),
      ],
    });
  },
};
