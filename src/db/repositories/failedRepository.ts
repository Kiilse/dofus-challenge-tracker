import { eq, and, sql, count, inArray } from 'drizzle-orm';
import { db } from '../client.ts';
import { failedChallenges, userLinks } from '../schema.ts';

export async function recordFailure(
  guildId: string,
  dofusPseudo: string,
  challenge: string,
  recordedBy: string,
) {
  await db.insert(failedChallenges).values({ guildId, dofusPseudo, challenge, recordedBy });
}

export async function getScoreboard(guildId: string) {
  // Per Discord account: sum of fails across all linked characters
  const linked = await db
    .select({
      discordId: userLinks.discordId,
      totalFails: count(failedChallenges.id),
    })
    .from(userLinks)
    .leftJoin(
      failedChallenges,
      and(
        eq(failedChallenges.guildId, userLinks.guildId),
        sql`lower(${failedChallenges.dofusPseudo}) = lower(${userLinks.dofusPseudo})`,
      ),
    )
    .where(eq(userLinks.guildId, guildId))
    .groupBy(userLinks.discordId)
    .orderBy(sql`count(${failedChallenges.id}) desc`);

  // Unlinked characters that have failures
  const unlinked = await db.execute<{ dofus_pseudo: string; total_fails: number }>(sql`
    SELECT fc.dofus_pseudo, COUNT(fc.id)::int AS total_fails
    FROM failed_challenges fc
    WHERE fc.guild_id = ${guildId}
      AND NOT EXISTS (
        SELECT 1 FROM user_links ul
        WHERE ul.guild_id = ${guildId}
          AND lower(ul.dofus_pseudo) = lower(fc.dofus_pseudo)
      )
    GROUP BY fc.dofus_pseudo
    ORDER BY total_fails DESC
  `);

  return { linked, unlinked: unlinked.rows ?? unlinked };
}

export async function getFailCountForPseudos(guildId: string, pseudos: string[]) {
  if (pseudos.length === 0) return [];

  const rows = await db
    .select({
      dofusPseudo: failedChallenges.dofusPseudo,
      totalFails: count(failedChallenges.id),
    })
    .from(failedChallenges)
    .where(
      and(
        eq(failedChallenges.guildId, guildId),
        inArray(sql`lower(${failedChallenges.dofusPseudo})`, pseudos.map((p) => p.toLowerCase())),
      ),
    )
    .groupBy(failedChallenges.dofusPseudo);

  return rows;
}
