function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`Missing required environment variable: ${key}`);
  return value;
}

export const config = {
  discordToken: requireEnv('DISCORD_TOKEN'),
  clientId: requireEnv('DISCORD_CLIENT_ID'),
  databaseUrl: requireEnv('DATABASE_URL'),
  guildIds: (process.env.DISCORD_GUILD_IDS ?? process.env.DISCORD_GUILD_ID ?? '')
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean),
};
