import { and, count, desc, eq, inArray, sql } from 'drizzle-orm';
import { db } from '../client.ts';
import { failedChallenges, userLinks } from '../schema.ts';

export type FailedType = 'challenge' | 'succes' | 'sabotage';

export type ScoreboardRow = {
  dofusPseudo: string;
  discordId: string | null;
  totalFails: number;
};

type ScoreboardPageSqlRow = {
  group_key: string;
  dofus_pseudo: string;
  discord_id: string | null;
  total_fails: number;
};

type ScoreboardByCharSqlRow = {
  dofus_pseudo: string;
  discord_id: string | null;
  total_fails: number;
};

type CountSqlRow = { total: number };

export async function recordFailure(
  guildId: string,
  dofusPseudo: string,
  challenge: string,
  recordedBy: string,
  type: FailedType,
) {
  await db
    .insert(failedChallenges)
    .values({ guildId, dofusPseudo, challenge, recordedBy, type });
}

export async function deleteLastFailure(
  guildId: string,
  dofusPseudo: string,
  challenge: string,
  type: FailedType,
): Promise<boolean> {
  const rows = await db
    .select({ id: failedChallenges.id })
    .from(failedChallenges)
    .where(
      and(
        eq(failedChallenges.guildId, guildId),
        eq(failedChallenges.type, type),
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

export async function getScoreboardPage(
  guildId: string,
  type: FailedType,
  page: number,
  pageSize: number,
): Promise<{ rows: ScoreboardRow[]; total: number }> {
  const offset = page * pageSize;

  const [pageResult, countResult] = await Promise.all([
    db.execute<ScoreboardPageSqlRow>(sql`
      SELECT
        ul.discord_id AS group_key,
        ul.discord_id,
        MIN(fc.dofus_pseudo) AS dofus_pseudo,
        COUNT(fc.id)::int AS total_fails
      FROM failed_challenges fc
      INNER JOIN user_links ul
        ON ul.guild_id = fc.guild_id
        AND lower(ul.dofus_pseudo) = lower(fc.dofus_pseudo)
      WHERE fc.guild_id = ${guildId} AND fc.type = ${type}
      GROUP BY ul.discord_id
      ORDER BY total_fails DESC
      LIMIT ${pageSize} OFFSET ${offset}
    `),
    db.execute<CountSqlRow>(sql`
      SELECT COUNT(DISTINCT ul.discord_id)::int AS total
      FROM failed_challenges fc
      INNER JOIN user_links ul
        ON ul.guild_id = fc.guild_id
        AND lower(ul.dofus_pseudo) = lower(fc.dofus_pseudo)
      WHERE fc.guild_id = ${guildId} AND fc.type = ${type}
    `),
  ]);

  const rows: ScoreboardRow[] = rowsFromExecute(pageResult).map((row) => ({
    dofusPseudo: row.dofus_pseudo,
    discordId: row.discord_id ?? null,
    totalFails: Number(row.total_fails),
  }));

  const total = Number(rowsFromExecute(countResult)[0]?.total ?? 0);

  return { rows, total };
}

export async function getScoreboardPageByCharacter(
  guildId: string,
  type: FailedType,
  page: number,
  pageSize: number,
): Promise<{ rows: ScoreboardRow[]; total: number }> {
  const offset = page * pageSize;

  const [pageResult, countResult] = await Promise.all([
    db.execute<ScoreboardByCharSqlRow>(sql`
      SELECT fc.dofus_pseudo, ul.discord_id, COUNT(fc.id)::int AS total_fails
      FROM failed_challenges fc
      LEFT JOIN user_links ul
        ON ul.guild_id = fc.guild_id
        AND lower(ul.dofus_pseudo) = lower(fc.dofus_pseudo)
      WHERE fc.guild_id = ${guildId} AND fc.type = ${type}
      GROUP BY fc.dofus_pseudo, ul.discord_id
      ORDER BY total_fails DESC
      LIMIT ${pageSize} OFFSET ${offset}
    `),
    db.execute<CountSqlRow>(sql`
      SELECT COUNT(DISTINCT lower(dofus_pseudo))::int AS total
      FROM failed_challenges
      WHERE guild_id = ${guildId} AND type = ${type}
    `),
  ]);

  const rows: ScoreboardRow[] = rowsFromExecute(pageResult).map((row) => ({
    dofusPseudo: row.dofus_pseudo,
    discordId: row.discord_id ?? null,
    totalFails: Number(row.total_fails),
  }));

  const total = Number(rowsFromExecute(countResult)[0]?.total ?? 0);

  return { rows, total };
}

export async function getSabotageTargetsForPseudo(
  guildId: string,
  dofusPseudo: string,
): Promise<{ cible: string; count: number }[]> {
  type Row = { intitule: string; total: number };

  const result = await db.execute<Row>(sql`
    SELECT challenge AS intitule, COUNT(id)::int AS total
    FROM failed_challenges
    WHERE guild_id = ${guildId}
      AND type = 'sabotage'
      AND lower(dofus_pseudo) = lower(${dofusPseudo})
    GROUP BY challenge
    ORDER BY total DESC, challenge ASC
  `);

  return rowsFromExecute(result).map((row) => ({
    intitule: row.intitule,
    count: Number(row.total),
  }));
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
