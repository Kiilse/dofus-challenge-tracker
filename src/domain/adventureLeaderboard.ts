/** Pure aggregation: adventure members + links + per-pseudo fail counts → maps for embeds. */
export function buildAdventureLeaderboard(
  pseudos: string[],
  linksByPseudoLower: Map<string, { discordId: string }>,
  failCounts: { dofusPseudo: string; totalFails: number | bigint }[],
): {
  accountMap: Map<string, { pseudos: string[]; totalFails: number }>;
  unlinkedMap: Map<string, number>;
} {
  const failByLower = new Map<string, number>();
  for (const f of failCounts) {
    failByLower.set(f.dofusPseudo.toLowerCase(), Number(f.totalFails));
  }

  const accountMap = new Map<
    string,
    { pseudos: string[]; totalFails: number }
  >();
  const unlinkedMap = new Map<string, number>();

  for (const pseudo of pseudos) {
    const link = linksByPseudoLower.get(pseudo.toLowerCase());
    const fails = failByLower.get(pseudo.toLowerCase()) ?? 0;

    if (link) {
      const existing = accountMap.get(link.discordId);
      if (existing) {
        existing.pseudos.push(pseudo);
        existing.totalFails += fails;
      } else {
        accountMap.set(link.discordId, {
          pseudos: [pseudo],
          totalFails: fails,
        });
      }
    } else {
      unlinkedMap.set(pseudo, fails);
    }
  }

  return { accountMap, unlinkedMap };
}
