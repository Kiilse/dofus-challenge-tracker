import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
  type ChatInputCommandInteraction,
} from 'discord.js';
import type { Command } from '../types/Command.ts';
import { upsertLink } from '../db/repositories/linkRepository.ts';

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
        .setDescription('Compte Discord cible (admin uniquement)')
        .setRequired(false),
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const guildId = interaction.guildId!;
    const dofusPseudo = interaction.options.getString('pseudo_dofus', true).trim();
    const targetUser = interaction.options.getUser('discord_user');

    if (targetUser) {
      const member = await interaction.guild!.members.fetch(interaction.user.id);
      if (!member.permissions.has(PermissionFlagsBits.ManageGuild)) {
        await interaction.reply({
          content: "Tu dois avoir la permission **Gérer le serveur** pour lier un perso à quelqu'un d'autre.",
          ephemeral: true,
        });
        return;
      }
    }

    const discordId = targetUser ? targetUser.id : interaction.user.id;
    await upsertLink(guildId, discordId, dofusPseudo);

    const embed = new EmbedBuilder()
      .setColor(0x4e9af1)
      .setTitle('Liaison enregistrée')
      .setDescription(`Le personnage **${dofusPseudo}** est maintenant lié à <@${discordId}>.`);

    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
