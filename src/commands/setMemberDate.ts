import {
  type ChatInputCommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
} from 'discord.js';
import { getMember, upsertMember } from '../db/repositories/memberRepository.ts';
import { findByPseudo } from '../db/repositories/linkRepository.ts';
import { requireGuildId } from '../discord/requireGuild.ts';
import type { Command } from '../types/Command.ts';

const COLOR = 0x4e9af1;

function parseDate(raw: string): Date | null {
  const dmY = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (dmY) {
    const d = new Date(Number(dmY[3]), Number(dmY[2]) - 1, Number(dmY[1]));
    if (!Number.isNaN(d.getTime())) return d;
  }
  const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) {
    const d = new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));
    if (!Number.isNaN(d.getTime())) return d;
  }
  return null;
}

export const setMemberDate: Command = {
  data: new SlashCommandBuilder()
    .setName('setmemberdate')
    .setDescription("Modifie la date d'arrivée d'un membre existant")
    .addStringOption((opt) =>
      opt
        .setName('pseudo')
        .setDescription('Pseudo Dofus du membre')
        .setRequired(true),
    )
    .addStringOption((opt) =>
      opt
        .setName('date')
        .setDescription("Nouvelle date d'arrivée (jj/mm/aaaa ou aaaa-mm-jj)")
        .setRequired(true),
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const guildId = await requireGuildId(interaction);
    if (guildId === undefined) return;

    const dofusPseudo = interaction.options.getString('pseudo', true).trim();
    const rawDate = interaction.options.getString('date', true).trim();

    const newDate = parseDate(rawDate);
    if (!newDate) {
      await interaction.reply({
        content: `Date invalide : **${rawDate}**. Utilisez le format \`jj/mm/aaaa\` ou \`aaaa-mm-jj\`.`,
        ephemeral: true,
      });
      return;
    }

    const existing = await getMember(guildId, dofusPseudo);
    if (!existing) {
      await interaction.reply({
        content: `Aucun membre trouvé avec le pseudo **${dofusPseudo}**. Utilisez \`/newmember\` pour l'enregistrer d'abord.`,
        ephemeral: true,
      });
      return;
    }

    await upsertMember(guildId, dofusPseudo, newDate, interaction.user.id);

    const link = await findByPseudo(guildId, dofusPseudo);
    const accountMention = link ? ` (<@${link.discordId}>)` : '';

    const oldDateStr = existing.joinedAt.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
    const newDateStr = newDate.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });

    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(COLOR)
          .setTitle("✏️ Date d'arrivée modifiée")
          .setDescription(
            `**${dofusPseudo}**${accountMention}\n~~${oldDateStr}~~ → **${newDateStr}**`,
          )
          .setFooter({ text: `Modifié par ${interaction.user.username}` })
          .setTimestamp(),
      ],
    });
  },
};
