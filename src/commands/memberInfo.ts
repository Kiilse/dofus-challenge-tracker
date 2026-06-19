import {
  type ChatInputCommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
} from 'discord.js';
import { getMember } from '../db/repositories/memberRepository.ts';
import { requireGuildId } from '../discord/requireGuild.ts';
import type { Command } from '../types/Command.ts';

export const memberInfo: Command = {
  data: new SlashCommandBuilder()
    .setName('memberinfo')
    .setDescription("Affiche la date d'arrivée d'un membre dans la guilde")
    .addStringOption((opt) =>
      opt
        .setName('pseudo')
        .setDescription('Pseudo Dofus du membre')
        .setRequired(true),
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const guildId = await requireGuildId(interaction);
    if (guildId === undefined) return;

    const dofusPseudo = interaction.options.getString('pseudo', true).trim();
    const member = await getMember(guildId, dofusPseudo);

    if (!member) {
      await interaction.reply({
        content: `Aucun membre trouvé avec le pseudo **${dofusPseudo}**.`,
        ephemeral: true,
      });
      return;
    }

    const dateStr = member.joinedAt.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });

    const now = new Date();
    const diffMs = now.getTime() - member.joinedAt.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const months = Math.floor(diffDays / 30);
    const days = diffDays % 30;
    const anciennete =
      months > 0 ? `${months} mois et ${days} jour(s)` : `${diffDays} jour(s)`;

    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(0x9b59b6)
          .setTitle(`📅 Informations membre — ${member.dofusPseudo}`)
          .addFields(
            { name: "Date d'arrivée", value: dateStr, inline: true },
            { name: "Ancienneté", value: anciennete, inline: true },
          )
          .setFooter({ text: `Enregistré par ${member.recordedBy}` })
          .setTimestamp(),
      ],
    });
  },
};
