import { eq, and, sql } from 'drizzle-orm';
import { db } from '../client.ts';
import { adventures, adventureMembers } from '../schema.ts';

export async function createAdventure(
  guildId: string,
  name: string,
  createdBy: string,
  pseudos: string[],
) {
  const [adventure] = await db
    .insert(adventures)
    .values({ guildId, name, createdBy })
    .returning({ id: adventures.id });

  if (!adventure) throw new Error('Failed to create adventure');

  await db.insert(adventureMembers).values(
    pseudos.map((dofusPseudo) => ({ adventureId: adventure.id, dofusPseudo })),
  );

  return adventure;
}

export async function findAdventure(guildId: string, name: string) {
  const rows = await db
    .select()
    .from(adventures)
    .where(
      and(
        eq(adventures.guildId, guildId),
        sql`lower(${adventures.name}) = lower(${name})`,
      ),
    )
    .limit(1);
  return rows[0] ?? null;
}

export async function getMembers(adventureId: number) {
  return db
    .select({ dofusPseudo: adventureMembers.dofusPseudo })
    .from(adventureMembers)
    .where(eq(adventureMembers.adventureId, adventureId));
}

export async function listAdventures(guildId: string) {
  return db.select().from(adventures).where(eq(adventures.guildId, guildId));
}
