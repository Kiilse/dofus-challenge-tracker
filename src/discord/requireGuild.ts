import type { ChatInputCommandInteraction } from 'discord.js';

export async function requireGuildId(
  interaction: ChatInputCommandInteraction,
): Promise<string | undefined> {
  const guildId = interaction.guildId;
  if (guildId) return guildId;

  await interaction.reply({
    content: 'Cette commande ne peut être utilisée que sur un serveur.',
    ephemeral: true,
  });
  return undefined;
}
