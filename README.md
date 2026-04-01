# Dofus Challenge Tracker

Bot Discord pour suivre les **challenges ratés** dans une guilde ou un groupe de joueurs Dofus : enregistrement d’un échec via une phrase figée, **liaison personnage Dofus ↔ compte Discord**, **classement global** du serveur et **aventures** (tableaux de score parallèles par liste de personnages).

## À propos de ce dépôt

**Ce projet n’est pas représentatif de mon niveau en développement.** C’est un bac à sable : j’y expérimente des idées, j’explore des stacks ou des patterns, et je vérifie ma compréhension de code que je n’ai pas écrite seul (documentation, exemples, assistance d’outils, refactors sur une base existante). La qualité, la structure ou les choix techniques ici ne doivent pas être lus comme un portfolio « niveau production » de mon travail habituel.

## Stack

- **Runtime** : [Bun](https://bun.sh)
- **Bot** : [discord.js](https://discord.js.org/) (slash commands)
- **Base de données** : PostgreSQL, [Drizzle ORM](https://orm.drizzle.team/)

## Scripts

| Commande            | Rôle                                      |
| ------------------- | ----------------------------------------- |
| `bun run dev`       | Lance le bot                              |
| `bun run deploy-commands` | Enregistre les commandes slash sur Discord |
| `bun test`          | Tests unitaires (Bun)                     |
| `bun run lint`      | Vérification Biome                        |
| `bun run db:*`      | Migrations / studio Drizzle               |

Les variables d’environnement attendues sont définies dans `config.ts` (token Discord, client ID, `DATABASE_URL`, etc.).
