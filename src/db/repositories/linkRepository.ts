import { and, eq, inArray, sql } from 'drizzle-orm';
import { db } from '../client.ts';
import { userLinks } from '../schema.ts';

export async function upsertLink(
  guildId: string,
  discordId: string,
  dofusPseudo: string,
) {
  await db
    .insert(userLinks)
    .values({ guildId, discordId, dofusPseudo })
    .onConflictDoUpdate({
      target: [userLinks.guildId, userLinks.dofusPseudo],
      set: { discordId, linkedAt: sql`now()` },
    });
}

export async function findByPseudo(guildId: string, dofusPseudo: string) {
  const rows = await db
    .select()
    .from(userLinks)
    .where(
      and(
        eq(userLinks.guildId, guildId),
        sql`lower(${userLinks.dofusPseudo}) = lower(${dofusPseudo})`,
      ),
    )
    .limit(1);
  return rows[0] ?? null;
}

export async function findLinksForPseudos(
  guildId: string,
  pseudos: string[],
): Promise<Map<string, typeof userLinks.$inferSelect>> {
  const map = new Map<string, typeof userLinks.$inferSelect>();
  if (pseudos.length === 0) return map;

  const lowered = [...new Set(pseudos.map((p) => p.toLowerCase()))];
  const rows = await db
    .select()
    .from(userLinks)
    .where(
      and(
        eq(userLinks.guildId, guildId),
        inArray(sql`lower(${userLinks.dofusPseudo})`, lowered),
      ),
    );

  for (const row of rows) {
    map.set(row.dofusPseudo.toLowerCase(), row);
  }
  return map;
}

export async function findByDiscordId(guildId: string, discordId: string) {
  return db
    .select()
    .from(userLinks)
    .where(
      and(eq(userLinks.guildId, guildId), eq(userLinks.discordId, discordId)),
    );
}

export async function getAllLinks(guildId: string) {
  return db.select().from(userLinks).where(eq(userLinks.guildId, guildId));
}
