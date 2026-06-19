import {
  type ChatInputCommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
  MessageFlags,
} from 'discord.js';
import { deleteLastFailure } from '../db/repositories/failedRepository.ts';
import { requireGuildId } from '../discord/requireGuild.ts';
import { embedColors } from '../presentation/theme.ts';
import type { Command } from '../types/Command.ts';

export const unsabotage: Command = {
  data: new SlashCommandBuilder()
    .setName('unsabotage')
    .setDescription('Supprime le dernier sabotage enregistré pour un personnage')
    .addStringOption((opt) =>
      opt
        .setName('pseudo')
        .setDescription('Pseudo Dofus du saboteur')
        .setRequired(true),
    )
    .addStringOption((opt) =>
      opt
        .setName('intitule')
        .setDescription("Intitulé exact du sabotage à supprimer")
        .setRequired(true),
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const guildId = await requireGuildId(interaction);
    if (guildId === undefined) return;

    const dofusPseudo = interaction.options.getString('pseudo', true).trim();
    const intitule = interaction.options.getString('intitule', true).trim();

    const deleted = await deleteLastFailure(guildId, dofusPseudo, intitule, 'sabotage');

    if (!deleted) {
      await interaction.reply({
        content: `Aucun sabotage trouvé pour **${dofusPseudo}** sur **${intitule}**.`,
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(embedColors.unfailed)
          .setTitle('Sabotage supprimé')
          .setDescription(
            `Le dernier sabotage de **${dofusPseudo}** sur **${intitule}** a été supprimé.`,
          )
          .setFooter({ text: `Supprimé par ${interaction.user.username}` })
          .setTimestamp(),
      ],
      flags: MessageFlags.Ephemeral,
    });
  },
};
