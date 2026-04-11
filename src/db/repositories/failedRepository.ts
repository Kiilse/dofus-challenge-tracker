import { and, count, desc, eq, inArray, sql } from 'drizzle-orm';
import { db } from '../client.ts';
import { failedChallenges, userLinks } from '../schema.ts';

export type ScoreboardLinkedRow = {
  discordId: string;
  totalFails: number;
};

export type ScoreboardUnlinkedRow = {
  dofusPseudo: string;
  totalFails: number;
};

type UnlinkedSqlRow = { dofus_pseudo: string; total_fails: number };

export async function recordFailure(
  guildId: string,
  dofusPseudo: string,
  challenge: string,
  recordedBy: string,
) {
  await db
    .insert(failedChallenges)
    .values({ guildId, dofusPseudo, challenge, recordedBy });
}

export async function deleteLastFailure(
  guildId: string,
  dofusPseudo: string,
  challenge: string,
): Promise<boolean> {
  const rows = await db
    .select({ id: failedChallenges.id })
    .from(failedChallenges)
    .where(
      and(
        eq(failedChallenges.guildId, guildId),
        sql`lower(${failedChallenges.dofusPseudo}) = lower(${dofusPseudo})`,
        sql`lower(${failedChallenges.challenge}) = lower(${challenge})`,
      ),
    )
    .orderBy(desc(failedChallenges.recordedAt))
    .limit(1);

  if (rows.length === 0) return false;

  await db.delete(failedChallenges).where(eq(failedChallenges.id, rows[0]!.id));
  return true;
}

function rowsFromExecute<T>(result: { rows?: T[] } | T[]): T[] {
  if (Array.isArray(result)) return result;
  return result.rows ?? [];
}

export async function getScoreboard(guildId: string): Promise<{
  linked: ScoreboardLinkedRow[];
  unlinked: ScoreboardUnlinkedRow[];
}> {
  const linkedRaw = await db
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

  const linked: ScoreboardLinkedRow[] = linkedRaw.map((row) => ({
    discordId: row.discordId,
    totalFails: Number(row.totalFails),
  }));

  const unlinkedResult = await db.execute<UnlinkedSqlRow>(sql`
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

  const unlinked: ScoreboardUnlinkedRow[] = rowsFromExecute(unlinkedResult).map(
    (row) => ({
      dofusPseudo: row.dofus_pseudo,
      totalFails: Number(row.total_fails),
    }),
  );

  return { linked, unlinked };
}

export async function getFailCountForPseudos(
  guildId: string,
  pseudos: string[],
) {
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
        inArray(
          sql`lower(${failedChallenges.dofusPseudo})`,
          pseudos.map((p) => p.toLowerCase()),
        ),
      ),
    )
    .groupBy(failedChallenges.dofusPseudo);

  return rows;
}
