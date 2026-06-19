import type { Client } from 'discord.js';
import { EmbedBuilder, TextChannel } from 'discord.js';
import { getAllGuildConfigs } from '../db/repositories/guildConfigRepository.ts';
import { getMembersReachingOneMonth, markAnniversaryAnnounced } from '../db/repositories/memberRepository.ts';

const COLOR = 0xf39c12;
const CHECK_INTERVAL_MS = 60 * 60 * 1000; // every hour

async function checkAnniversaries(client: Client): Promise<void> {
  const configs = await getAllGuildConfigs();

  for (const { guildId, reportingChannelId } of configs) {
    const members = await getMembersReachingOneMonth(guildId);
    if (members.length === 0) continue;

    let channel: TextChannel;
    try {
      const fetched = await client.channels.fetch(reportingChannelId);
      if (!fetched || !(fetched instanceof TextChannel)) continue;
      channel = fetched;
    } catch {
      console.warn(`[anniversary] Impossible de récupérer le canal ${reportingChannelId} (guild ${guildId})`);
      continue;
    }

    for (const member of members) {
      const dateStr = member.joinedAt.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });

      try {
        await channel.send({
          embeds: [
            new EmbedBuilder()
              .setColor(COLOR)
              .setTitle('🎉 1 mois dans la guilde !')
              .setDescription(
                `**${member.dofusPseudo}** a rejoint la guilde il y a un mois (le **${dateStr}**). Félicitations !`,
              )
              .setTimestamp(),
          ],
        });
        await markAnniversaryAnnounced(member.id);
      } catch (err) {
        console.error(`[anniversary] Erreur lors de l'annonce pour ${member.dofusPseudo}:`, err);
      }
    }
  }
}

export function startAnniversaryScheduler(client: Client): void {
  // Initial check shortly after startup
  setTimeout(() => checkAnniversaries(client), 10_000);
  setInterval(() => checkAnniversaries(client), CHECK_INTERVAL_MS);
  console.log('✓ Scheduler d\'anniversaires démarré (vérification toutes les heures)');
}
