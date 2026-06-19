import {
  type ChatInputCommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
} from 'discord.js';
import { upsertMember } from '../db/repositories/memberRepository.ts';
import { findByPseudo } from '../db/repositories/linkRepository.ts';
import { requireGuildId } from '../discord/requireGuild.ts';
import type { Command } from '../types/Command.ts';

const COLOR = 0x2ecc71;

function parseDate(raw: string): Date | null {
  // Accepts dd/mm/yyyy or yyyy-mm-dd
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

export const newMember: Command = {
  data: new SlashCommandBuilder()
    .setName('newmember')
    .setDescription("Enregistre la date d'arrivée d'un membre dans la guilde")
    .addStringOption((opt) =>
      opt
        .setName('pseudo')
        .setDescription('Pseudo Dofus du membre')
        .setRequired(true),
    )
    .addStringOption((opt) =>
      opt
        .setName('date')
        .setDescription("Date d'arrivée (jj/mm/aaaa ou aaaa-mm-jj) — aujourd'hui par défaut")
        .setRequired(false),
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const guildId = await requireGuildId(interaction);
    if (guildId === undefined) return;

    const dofusPseudo = interaction.options.getString('pseudo', true).trim();
    const rawDate = interaction.options.getString('date', false)?.trim();

    let joinedAt: Date;
    if (rawDate) {
      const parsed = parseDate(rawDate);
      if (!parsed) {
        await interaction.reply({
          content: `Date invalide : **${rawDate}**. Utilisez le format \`jj/mm/aaaa\` ou \`aaaa-mm-jj\`.`,
          ephemeral: true,
        });
        return;
      }
      joinedAt = parsed;
    } else {
      joinedAt = new Date();
    }

    const { created } = await upsertMember(guildId, dofusPseudo, joinedAt, interaction.user.id);

    const link = await findByPseudo(guildId, dofusPseudo);
    const accountMention = link ? ` (<@${link.discordId}>)` : '';

    const dateStr = joinedAt.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });

    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(COLOR)
          .setTitle(created ? '✅ Nouveau membre enregistré !' : '✏️ Date mise à jour')
          .setDescription(
            `**${dofusPseudo}**${accountMention} — arrivée le **${dateStr}**`,
          )
          .setFooter({ text: `Enregistré par ${interaction.user.username}` })
          .setTimestamp(),
      ],
    });
  },
};
