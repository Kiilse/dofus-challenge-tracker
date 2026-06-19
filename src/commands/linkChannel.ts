import {
  ChannelType,
  type ChatInputCommandInteraction,
  EmbedBuilder,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from 'discord.js';
import { setReportingChannel } from '../db/repositories/guildConfigRepository.ts';
import { requireGuildId } from '../discord/requireGuild.ts';
import type { Command } from '../types/Command.ts';

export const linkChannel: Command = {
  data: new SlashCommandBuilder()
    .setName('linkchannel')
    .setDescription('Définit le canal de configuration et de reporting de la guilde (admins uniquement)')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addChannelOption((opt) =>
      opt
        .setName('canal')
        .setDescription('Canal textuel à utiliser pour les commandes et les rapports')
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(true),
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const guildId = await requireGuildId(interaction);
    if (guildId === undefined) return;

    const channel = interaction.options.getChannel('canal', true);

    await setReportingChannel(guildId, channel.id);

    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(0x3498db)
          .setTitle('✅ Canal de reporting configuré')
          .setDescription(
            `Le canal <#${channel.id}> est maintenant le canal de configuration de la guilde.\n\n` +
            `• La commande \`/newmember\` ne sera utilisable que dans ce canal.\n` +
            `• Les annonces d'ancienneté (1 mois) y seront publiées automatiquement.`,
          )
          .setFooter({ text: `Configuré par ${interaction.user.username}` })
          .setTimestamp(),
      ],
      ephemeral: true,
    });
  },
};
