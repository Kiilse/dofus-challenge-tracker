import {
  type ChatInputCommandInteraction,
  EmbedBuilder,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from 'discord.js';
import { deleteLastFailure } from '../db/repositories/failedRepository.ts';
import { requireGuildId } from '../discord/requireGuild.ts';
import { embedColors } from '../presentation/theme.ts';
import type { Command } from '../types/Command.ts';

export const unfailedSucces: Command = {
  data: new SlashCommandBuilder()
    .setName('unfailedsucces')
    .setDescription('Supprime le dernier succès raté enregistré pour un personnage')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addStringOption((opt) =>
      opt
        .setName('pseudo')
        .setDescription('Pseudo Dofus du joueur')
        .setRequired(true),
    )
    .addStringOption((opt) =>
      opt
        .setName('succes')
        .setDescription('Nom du succès raté')
        .setRequired(true),
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const guildId = await requireGuildId(interaction);
    if (guildId === undefined) return;

    const dofusPseudo = interaction.options.getString('pseudo', true).trim();
    const succes = interaction.options.getString('succes', true).trim();

    const deleted = await deleteLastFailure(guildId, dofusPseudo, succes, 'succes');

    if (!deleted) {
      await interaction.reply({
        content: `Aucun échec trouvé pour **${dofusPseudo}** sur le succès **${succes}**.`,
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(embedColors.unfailed)
          .setTitle('Échec supprimé')
          .setDescription(
            `Le dernier échec de **${dofusPseudo}** sur le succès **${succes}** a été supprimé.`,
          )
          .setFooter({ text: `Supprimé par ${interaction.user.username}` })
          .setTimestamp(),
      ],
      flags: MessageFlags.Ephemeral,
    });
  },
};
