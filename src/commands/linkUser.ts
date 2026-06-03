import {
  type ChatInputCommandInteraction,
  EmbedBuilder,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from 'discord.js';
import { upsertLink } from '../db/repositories/linkRepository.ts';
import { requireGuildId } from '../discord/requireGuild.ts';
import { embedColors } from '../presentation/theme.ts';
import type { Command } from '../types/Command.ts';

export const linkUser: Command = {
  data: new SlashCommandBuilder()
    .setName('linkuser')
    .setDescription('Lie manuellement un personnage Dofus à un ID Discord (créateur du serveur)')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addStringOption((opt) =>
      opt
        .setName('pseudo')
        .setDescription('Nom du personnage Dofus')
        .setRequired(true),
    )
    .addStringOption((opt) =>
      opt
        .setName('discord_id')
        .setDescription('ID Discord du joueur (clic droit → Copier l\'identifiant)')
        .setRequired(true),
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const guildId = await requireGuildId(interaction);
    if (guildId === undefined) return;

    const guild = interaction.guild;
    if (!guild) {
      await interaction.reply({ content: 'Serveur introuvable.', ephemeral: true });
      return;
    }

    if (interaction.user.id !== guild.ownerId) {
      await interaction.reply({
        content: "Seul le créateur du serveur peut utiliser cette commande.",
        ephemeral: true,
      });
      return;
    }

    const dofusPseudo = interaction.options.getString('pseudo', true).trim();
    const discordId = interaction.options.getString('discord_id', true).trim();

    if (!/^\d{17,20}$/.test(discordId)) {
      await interaction.reply({
        content: 'ID Discord invalide. Active le Mode Développeur dans Discord (Paramètres → Avancés), puis clic droit sur un utilisateur → "Copier l\'identifiant".',
        ephemeral: true,
      });
      return;
    }

    await upsertLink(guildId, discordId, dofusPseudo);

    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(embedColors.link)
          .setTitle('Liaison enregistrée')
          .setDescription(`Le personnage **${dofusPseudo}** est maintenant lié à <@${discordId}>.`),
      ],
      ephemeral: true,
    });
  },
};
