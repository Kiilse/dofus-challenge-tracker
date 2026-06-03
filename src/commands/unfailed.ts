import {
  type ChatInputCommandInteraction,
  EmbedBuilder,
  PermissionFlagsBits,
  SlashCommandBuilder,
  MessageFlags,
} from 'discord.js';
import { deleteLastFailure } from '../db/repositories/failedRepository.ts';
import { requireGuildId } from '../discord/requireGuild.ts';
import { embedColors } from '../presentation/theme.ts';
import type { Command } from '../types/Command.ts';
import { parseFailedPhrase } from './failed.ts';

export const unfailed: Command = {
  data: new SlashCommandBuilder()
    .setName('unfailed')
    .setDescription('Supprime le dernier challenge raté enregistré pour un personnage')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addStringOption((opt) =>
      opt
        .setName('phrase')
        .setDescription('Pseudo-Dofus a fait échouer le challenge Nom-Du-Challenge')
        .setRequired(true),
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const guildId = await requireGuildId(interaction);
    if (guildId === undefined) return;

    const phrase = interaction.options.getString('phrase', true);
    const parsed = parseFailedPhrase(phrase);
    if (!parsed) {
      await interaction.reply({
        content:
          'Format invalide. Utilise : `Pseudo-Dofus a fait échouer le challenge Nom-Du-Challenge`',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const { pseudo: dofusPseudo, challenge } = parsed;
    const deleted = await deleteLastFailure(guildId, dofusPseudo, challenge, 'challenge');

    if (!deleted) {
      await interaction.reply({
        content: `Aucun échec trouvé pour **${dofusPseudo}** sur le challenge **${challenge}**.`,
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
            `Le dernier échec de **${dofusPseudo}** sur le challenge **${challenge}** a été supprimé.`,
          )
          .setFooter({ text: `Supprimé par ${interaction.user.username}` })
          .setTimestamp(),
      ],
      flags: MessageFlags.Ephemeral,
    });
  },
};
