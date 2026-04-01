import type { Guild } from 'discord.js';

export const RANKING_MEDALS = ['🥇', '🥈', '🥉'] as const;

export function formatFailCount(n: number): string {
  return `${n} fail${n !== 1 ? 's' : ''}`;
}

export function rankingMedalForIndex(index: number): string {
  return RANKING_MEDALS[index] ?? `${index + 1}.`;
}

export async function resolveMemberDisplayName(
  guild: Guild,
  discordId: string,
): Promise<string> {
  try {
    const member = await guild.members.fetch(discordId);
    return member.displayName;
  } catch {
    return `<@${discordId}>`;
  }
}
