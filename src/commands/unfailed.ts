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
import { parseFailedPhrase } from './failed.ts';

export const unfailed: Command = {
  data: new SlashCommandBuilder()
    .setName('unfailed')
    .setDescription('Supprime le dernier échec enregistré pour un personnage')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((sub) =>
      sub
        .setName('challenge')
        .setDescription('Supprime le dernier challenge raté')
        .addStringOption((opt) =>
          opt
            .setName('phrase')
            .setDescription('Pseudo-Dofus a fait échouer le challenge Nom-Du-Challenge')
            .setRequired(true),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName('succes')
        .setDescription('Supprime le dernier succès raté')
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
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const guildId = await requireGuildId(interaction);
    if (guildId === undefined) return;

    const sub = interaction.options.getSubcommand();

    if (sub === 'challenge') {
      const phrase = interaction.options.getString('phrase', true);
      const parsed = parseFailedPhrase(phrase);
      if (!parsed) {
        await interaction.reply({
          content:
            'Format invalide. Utilise : `Pseudo-Dofus a fait échouer le challenge Nom-Du-Challenge`',
          ephemeral: true,
        });
        return;
      }

      const { pseudo: dofusPseudo, challenge } = parsed;
      const deleted = await deleteLastFailure(guildId, dofusPseudo, challenge, 'challenge');

      if (!deleted) {
        await interaction.reply({
          content: `Aucun échec trouvé pour **${dofusPseudo}** sur le challenge **${challenge}**.`,
          ephemeral: true,
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
        ephemeral: true,
      });
      return;
    }

    if (sub === 'succes') {
      const dofusPseudo = interaction.options.getString('pseudo', true).trim();
      const succes = interaction.options.getString('succes', true).trim();
      const deleted = await deleteLastFailure(guildId, dofusPseudo, succes, 'succes');

      if (!deleted) {
        await interaction.reply({
          content: `Aucun échec trouvé pour **${dofusPseudo}** sur le succès **${succes}**.`,
          ephemeral: true,
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
        ephemeral: true,
      });
    }
  },
};
