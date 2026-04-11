import {
  type ChatInputCommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
} from 'discord.js';
import { upsertLink } from '../db/repositories/linkRepository.ts';
import { requireGuildId } from '../discord/requireGuild.ts';
import { embedColors } from '../presentation/theme.ts';
import type { Command } from '../types/Command.ts';

export const link: Command = {
  data: new SlashCommandBuilder()
    .setName('link')
    .setDescription('Associe un personnage Dofus à un compte Discord')
    .addStringOption((opt) =>
      opt
        .setName('pseudo_dofus')
        .setDescription('Nom du personnage Dofus')
        .setRequired(true),
    )
    .addUserOption((opt) =>
      opt
        .setName('discord_user')
        .setDescription('Compte Discord cible (créateur du serveur uniquement)')
        .setRequired(false),
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

    const dofusPseudo = interaction.options
      .getString('pseudo_dofus', true)
      .trim();
    const targetUser = interaction.options.getUser('discord_user');

    if (targetUser && interaction.user.id !== guild.ownerId) {
      await interaction.reply({
        content: "Seul le créateur du serveur peut lier un personnage à quelqu'un d'autre.",
        ephemeral: true,
      });
      return;
    }

    const discordId = targetUser ? targetUser.id : interaction.user.id;
    await upsertLink(guildId, discordId, dofusPseudo);

    const embed = new EmbedBuilder()
      .setColor(embedColors.link)
      .setTitle('Liaison enregistrée')
      .setDescription(
        `Le personnage **${dofusPseudo}** est maintenant lié à <@${discordId}>.`,
      );

    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
