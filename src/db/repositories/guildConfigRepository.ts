import { eq } from 'drizzle-orm';
import { db } from '../client.ts';
import { guildConfig } from '../schema.ts';

export async function getReportingChannel(guildId: string): Promise<string | null> {
  const rows = await db
    .select({ reportingChannelId: guildConfig.reportingChannelId })
    .from(guildConfig)
    .where(eq(guildConfig.guildId, guildId))
    .limit(1);
  return rows[0]?.reportingChannelId ?? null;
}

export async function setReportingChannel(guildId: string, channelId: string): Promise<void> {
  await db
    .insert(guildConfig)
    .values({ guildId, reportingChannelId: channelId, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: guildConfig.guildId,
      set: { reportingChannelId: channelId, updatedAt: new Date() },
    });
}

export async function getAllGuildConfigs(): Promise<{ guildId: string; reportingChannelId: string }[]> {
  return db.select({ guildId: guildConfig.guildId, reportingChannelId: guildConfig.reportingChannelId }).from(guildConfig);
}
