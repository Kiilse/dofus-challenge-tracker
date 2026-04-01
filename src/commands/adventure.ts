import {
  type ChatInputCommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
} from 'discord.js';
import {
  createAdventure,
  findAdventure,
  getMembers,
  listAdventures,
} from '../db/repositories/adventureRepository.ts';
import { getFailCountForPseudos } from '../db/repositories/failedRepository.ts';
import { findLinksForPseudos } from '../db/repositories/linkRepository.ts';
import { requireGuildId } from '../discord/requireGuild.ts';
import { buildAdventureLeaderboard } from '../domain/adventureLeaderboard.ts';
import {
  formatFailCount,
  rankingMedalForIndex,
  resolveMemberDisplayName,
} from '../presentation/ranking.ts';
import { embedColors } from '../presentation/theme.ts';
import type { Command } from '../types/Command.ts';

function isUniqueViolation(err: unknown): boolean {
  const o = err as { code?: string; cause?: { code?: string } };
  return o.code === '23505' || o.cause?.code === '23505';
}

async function handleCreate(
  interaction: ChatInputCommandInteraction,
  guildId: string,
) {
  const name = interaction.options.getString('nom', true).trim();
  const membersRaw = interaction.options.getString('membres', true);
  const pseudos = membersRaw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  if (pseudos.length === 0) {
    await interaction.reply({
      content: 'Tu dois fournir au moins un personnage.',
      ephemeral: true,
    });
    return;
  }

  try {
    await createAdventure(guildId, name, interaction.user.id, pseudos);
  } catch (err) {
    if (isUniqueViolation(err)) {
      await interaction.reply({
        content: `Une aventure nommée **${name}** existe déjà sur ce serveur.`,
        ephemeral: true,
      });
      return;
    }
    console.error('createAdventure:', err);
    await interaction.reply({
      content:
        "Impossible de créer l'aventure pour le moment. Réessaie plus tard.",
      ephemeral: true,
    });
    return;
  }

  const embed = new EmbedBuilder()
    .setColor(embedColors.adventureCreate)
    .setTitle('Aventure créée !')
    .setDescription(
      `**${name}** a été créée avec ${pseudos.length} membre(s) :\n${pseudos.map((p) => `• ${p}`).join('\n')}`,
    );
  await interaction.reply({ embeds: [embed], ephemeral: true });
}

async function handleView(
  interaction: ChatInputCommandInteraction,
  guildId: string,
) {
  const guild = interaction.guild;
  if (!guild) {
    await interaction.reply({
      content: 'Serveur introuvable.',
      ephemeral: true,
    });
    return;
  }

  await interaction.deferReply();
  const name = interaction.options.getString('nom', true).trim();

  const adv = await findAdventure(guildId, name);
  if (!adv) {
    await interaction.editReply({
      content: `Aucune aventure trouvée avec le nom **${name}**.`,
    });
    return;
  }

  const members = await getMembers(adv.id);
  const pseudos = members.map((m) => m.dofusPseudo);
  const failCounts = await getFailCountForPseudos(guildId, pseudos);
  const linksByPseudoLower = await findLinksForPseudos(guildId, pseudos);
  const { accountMap, unlinkedMap } = buildAdventureLeaderboard(
    pseudos,
    linksByPseudoLower,
    failCounts,
  );

  const embed = new EmbedBuilder()
    .setColor(embedColors.adventureView)
    .setTitle(`⚔️ Aventure : ${adv.name}`)
    .setTimestamp();

  if (accountMap.size === 0 && unlinkedMap.size === 0) {
    embed.setDescription('Aucun fail enregistré pour cette aventure.');
    await interaction.editReply({ embeds: [embed] });
    return;
  }

  if (accountMap.size > 0) {
    const sorted = [...accountMap.entries()].sort(
      (a, b) => b[1].totalFails - a[1].totalFails,
    );
    const lines = await Promise.all(
      sorted.map(async ([discordId, data], i) => {
        const medal = rankingMedalForIndex(i);
        const displayName = await resolveMemberDisplayName(guild, discordId);
        const pseudoList = data.pseudos.join(', ');
        return `${medal} **${displayName}** (${pseudoList}) — ${formatFailCount(data.totalFails)}`;
      }),
    );
    embed.addFields({ name: 'Comptes Discord', value: lines.join('\n') });
  }

  if (unlinkedMap.size > 0) {
    const lines = [...unlinkedMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([pseudo, fails]) => `• **${pseudo}** — ${formatFailCount(fails)}`);
    embed.addFields({ name: 'Personnages non liés', value: lines.join('\n') });
  }

  await interaction.editReply({ embeds: [embed] });
}

async function handleList(
  interaction: ChatInputCommandInteraction,
  guildId: string,
) {
  const advList = await listAdventures(guildId);
  if (advList.length === 0) {
    await interaction.reply({
      content: 'Aucune aventure créée sur ce serveur.',
      ephemeral: true,
    });
    return;
  }
  const lines = advList.map(
    (a) => `• **${a.name}** — créée par <@${a.createdBy}>`,
  );
  const embed = new EmbedBuilder()
    .setColor(embedColors.adventureList)
    .setTitle('Aventures de ce serveur')
    .setDescription(lines.join('\n'));
  await interaction.reply({ embeds: [embed], ephemeral: true });
}

export const adventure: Command = {
  data: new SlashCommandBuilder()
    .setName('adventure')
    .setDescription('Gère les tableaux de score parallèles (aventures)')
    .addSubcommand((sub) =>
      sub
        .setName('create')
        .setDescription('Crée une nouvelle aventure')
        .addStringOption((opt) =>
          opt
            .setName('nom')
            .setDescription("Nom de l'aventure")
            .setRequired(true),
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
          opt
            .setName('nom')
            .setDescription("Nom de l'aventure")
            .setRequired(true),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName('list')
        .setDescription('Liste toutes les aventures de ce serveur'),
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const guildId = await requireGuildId(interaction);
    if (guildId === undefined) return;

    const sub = interaction.options.getSubcommand();
    if (sub === 'create') return handleCreate(interaction, guildId);
    if (sub === 'view') return handleView(interaction, guildId);
    if (sub === 'list') return handleList(interaction, guildId);
  },
};
