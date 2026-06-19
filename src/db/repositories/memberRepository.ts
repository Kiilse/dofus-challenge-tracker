import { and, eq, sql } from 'drizzle-orm';
import { db } from '../client.ts';
import { guildMembers } from '../schema.ts';

export type GuildMember = {
  dofusPseudo: string;
  joinedAt: Date;
  recordedBy: string;
};

export async function upsertMember(
  guildId: string,
  dofusPseudo: string,
  joinedAt: Date,
  recordedBy: string,
): Promise<{ created: boolean }> {
  const existing = await db
    .select({ id: guildMembers.id })
    .from(guildMembers)
    .where(
      and(
        eq(guildMembers.guildId, guildId),
        sql`lower(${guildMembers.dofusPseudo}) = lower(${dofusPseudo})`,
      ),
    )
    .limit(1);

  if (existing.length === 0) {
    await db.insert(guildMembers).values({ guildId, dofusPseudo, joinedAt, recordedBy });
    return { created: true };
  }

  await db
    .update(guildMembers)
    .set({ joinedAt, recordedBy })
    .where(eq(guildMembers.id, existing[0]!.id));

  return { created: false };
}

export async function getMember(
  guildId: string,
  dofusPseudo: string,
): Promise<GuildMember | null> {
  const rows = await db
    .select({
      dofusPseudo: guildMembers.dofusPseudo,
      joinedAt: guildMembers.joinedAt,
      recordedBy: guildMembers.recordedBy,
    })
    .from(guildMembers)
    .where(
      and(
        eq(guildMembers.guildId, guildId),
        sql`lower(${guildMembers.dofusPseudo}) = lower(${dofusPseudo})`,
      ),
    )
    .limit(1);

  return rows[0] ?? null;
}
