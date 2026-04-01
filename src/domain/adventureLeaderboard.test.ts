import { describe, expect, test } from 'bun:test';
import { buildAdventureLeaderboard } from './adventureLeaderboard.ts';

describe('buildAdventureLeaderboard', () => {
  test('merges linked pseudos under same Discord id', () => {
    const links = new Map([
      ['a', { discordId: '1' }],
      ['b', { discordId: '1' }],
    ]);
    const pseudos = ['A', 'B'];
    const failCounts = [
      { dofusPseudo: 'A', totalFails: 2 },
      { dofusPseudo: 'B', totalFails: 3 },
    ];
    const { accountMap, unlinkedMap } = buildAdventureLeaderboard(
      pseudos,
      links,
      failCounts,
    );
    expect(unlinkedMap.size).toBe(0);
    expect(accountMap.size).toBe(1);
    const agg = accountMap.get('1');
    expect(agg?.totalFails).toBe(5);
    expect(agg?.pseudos.sort()).toEqual(['A', 'B']);
  });

  test('puts unlinked pseudos in unlinkedMap', () => {
    const links = new Map<string, { discordId: string }>();
    const pseudos = ['Solo'];
    const failCounts = [{ dofusPseudo: 'Solo', totalFails: 1 }];
    const { accountMap, unlinkedMap } = buildAdventureLeaderboard(
      pseudos,
      links,
      failCounts,
    );
    expect(accountMap.size).toBe(0);
    expect(unlinkedMap.get('Solo')).toBe(1);
  });
});
