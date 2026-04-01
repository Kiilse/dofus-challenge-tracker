import { SlashCommandBuilder, EmbedBuilder, type ChatInputCommandInteraction } from 'discord.js';
import type { Command } from '../types/Command.ts';
import {
  createAdventure,
  findAdventure,
  getMembers,
  listAdventures,
} from '../db/repositories/adventureRepository.ts';
import { findByPseudo } from '../db/repositories/linkRepository.ts';
import { getFailCountForPseudos } from '../db/repositories/failedRepository.ts';

const MEDALS = ['🥇', '🥈', '🥉'];

export const adventure: Command = {
  data: new SlashCommandBuilder()
    .setName('adventure')
    .setDescription('Gère les tableaux de score parallèles (aventures)')
    .addSubcommand((sub) =>
      sub
        .setName('create')
        .setDescription('Crée une nouvelle aventure')
        .addStringOption((opt) =>
          opt.setName('nom').setDescription("Nom de l'aventure").setRequired(true),
        )
        .addStringOption((opt) =>
          opt
            .setName('membres')
            .setDescription('Pseudos Dofus séparés par des virgules')
            .setRequired(true),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName('view')
        .setDescription("Affiche le classement d'une aventure")
        .addStringOption((opt) =>
          opt.setName('nom').setDescription("Nom de l'aventure").setRequired(true),
        ),
    )
    .addSubcommand((sub) =>
      sub.setName('list').setDescription('Liste toutes les aventures de ce serveur'),
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guildId!;

    if (sub === 'create') {
      const name = interaction.options.getString('nom', true).trim();
      const membersRaw = interaction.options.getString('membres', true);
      const pseudos = membersRaw
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      if (pseudos.length === 0) {
        await interaction.reply({ content: 'Tu dois fournir au moins un personnage.', ephemeral: true });
        return;
      }

      try {
        await createAdventure(guildId, name, interaction.user.id, pseudos);
      } catch {
        await interaction.reply({
          content: `Une aventure nommée **${name}** existe déjà sur ce serveur.`,
          ephemeral: true,
        });
        return;
      }

      const embed = new EmbedBuilder()
        .setColor(0x2ecc71)
        .setTitle('Aventure créée !')
        .setDescription(
          `**${name}** a été créée avec ${pseudos.length} membre(s) :\n${pseudos.map((p) => `• ${p}`).join('\n')}`,
        );
      await interaction.reply({ embeds: [embed], ephemeral: true });
      return;
    }

    if (sub === 'view') {
      await interaction.deferReply();
      const name = interaction.options.getString('nom', true).trim();

      const adv = await findAdventure(guildId, name);
      if (!adv) {
        await interaction.editReply({ content: `Aucune aventure trouvée avec le nom **${name}**.` });
        return;
      }

      const members = await getMembers(adv.id);
      const pseudos = members.map((m) => m.dofusPseudo);
      const failCounts = await getFailCountForPseudos(guildId, pseudos);

      // Group by Discord account
      const accountMap = new Map<string, { pseudos: string[]; totalFails: number }>();
      const unlinkedMap = new Map<string, number>();

      for (const pseudo of pseudos) {
        const link = await findByPseudo(guildId, pseudo);
        const fails =
          failCounts.find((f) => f.dofusPseudo.toLowerCase() === pseudo.toLowerCase())
            ?.totalFails ?? 0;

        if (link) {
          const existing = accountMap.get(link.discordId);
          if (existing) {
            existing.pseudos.push(pseudo);
            existing.totalFails += Number(fails);
          } else {
            accountMap.set(link.discordId, { pseudos: [pseudo], totalFails: Number(fails) });
          }
        } else {
          unlinkedMap.set(pseudo, Number(fails));
        }
      }

      const embed = new EmbedBuilder()
        .setColor(0x9b59b6)
        .setTitle(`⚔️ Aventure : ${adv.name}`)
        .setTimestamp();

      if (accountMap.size === 0 && unlinkedMap.size === 0) {
        embed.setDescription('Aucun fail enregistré pour cette aventure.');
        await interaction.editReply({ embeds: [embed] });
        return;
      }

      // Sort and display linked accounts
      if (accountMap.size > 0) {
        const sorted = [...accountMap.entries()].sort((a, b) => b[1].totalFails - a[1].totalFails);
        const lines = await Promise.all(
          sorted.map(async ([discordId, data], i) => {
            const medal = MEDALS[i] ?? `${i + 1}.`;
            let name: string;
            try {
              const member = await interaction.guild!.members.fetch(discordId);
              name = member.displayName;
            } catch {
              name = `<@${discordId}>`;
            }
            const pseudoList = data.pseudos.join(', ');
            return `${medal} **${name}** (${pseudoList}) — ${data.totalFails} fail${data.totalFails !== 1 ? 's' : ''}`;
          }),
        );
        embed.addFields({ name: 'Comptes Discord', value: lines.join('\n') });
      }

      // Unlinked characters
      if (unlinkedMap.size > 0) {
        const lines = [...unlinkedMap.entries()]
          .sort((a, b) => b[1] - a[1])
          .map(([pseudo, fails]) => `• **${pseudo}** — ${fails} fail${fails !== 1 ? 's' : ''}`);
        embed.addFields({ name: 'Personnages non liés', value: lines.join('\n') });
      }

      await interaction.editReply({ embeds: [embed] });
      return;
    }

    if (sub === 'list') {
      const advList = await listAdventures(guildId);
      if (advList.length === 0) {
        await interaction.reply({ content: 'Aucune aventure créée sur ce serveur.', ephemeral: true });
        return;
      }
      const lines = advList.map((a) => `• **${a.name}** — créée par <@${a.createdBy}>`);
      const embed = new EmbedBuilder()
        .setColor(0x3498db)
        .setTitle('Aventures de ce serveur')
        .setDescription(lines.join('\n'));
      await interaction.reply({ embeds: [embed], ephemeral: true });
    }
  },
};
