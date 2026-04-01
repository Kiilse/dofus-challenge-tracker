import { SlashCommandBuilder, EmbedBuilder, type ChatInputCommandInteraction } from 'discord.js';
import type { Command } from '../types/Command.ts';

const LINES = [
  '`/link` — Associe un personnage Dofus à un compte Discord (option admin : cibler un autre utilisateur).',
  '`/failed` — Enregistre un challenge raté pour un pseudo Dofus.',
  '`/scoreboard` — Classement des challenges ratés sur le serveur.',
  '`/adventure` — Aventures : `create`, `view`, `list` (tableaux de score parallèles).',
] as const;

export const help: Command = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Liste les commandes du bot et leur rôle'),

  async execute(interaction: ChatInputCommandInteraction) {
    const embed = new EmbedBuilder()
      .setColor(0x3498db)
      .setTitle('Commandes du bot')
      .setDescription(LINES.join('\n\n'));

    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
