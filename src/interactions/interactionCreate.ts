import { MessageFlags, type Client, type Collection } from 'discord.js';
import type { Command } from '../types/Command.ts';

export function registerInteractionHandler(
  client: Client,
  commands: Collection<string, Command>,
) {
  client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const command = commands.get(interaction.commandName);
    if (!command) return;

    try {
      await command.execute(interaction);
    } catch (err) {
      console.error(`Error executing /${interaction.commandName}:`, err);
      const msg = {
        content:
          "Une erreur est survenue lors de l'exécution de cette commande.",
        flags: MessageFlags.Ephemeral,
      };
      if (interaction.deferred || interaction.replied) {
        await interaction.followUp(msg).catch(console.error);
      } else {
        await interaction.reply(msg).catch(console.error);
      }
    }
  });
}
