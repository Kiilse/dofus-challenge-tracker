# Commande bun du bot (utilisée pour repérer le processus au restart)
BOT_CMD := bun run src/index.ts

.PHONY: install up down dev restart-bot migrate migrate-generate deploy-commands studio

## Installe les dépendances (bun)
install:
	bun install

## Démarre Postgres en arrière-plan (docker compose)
up:
	docker compose up -d

## Arrête les conteneurs docker compose
down:
	docker compose down

## Dev : Postgres + bot (bloque le terminal ; Ctrl+C arrête le bot, pas Postgres)
dev: up
	bun run dev

## Relance le bot : arrête les processus `bun run src/index.ts` puis redémarre (depuis la racine du repo)
restart-bot:
	-pgrep -f "$(BOT_CMD)" | xargs -r kill
	@sleep 0.5
	bun run dev

## Applique les migrations Drizzle (DATABASE_URL requis, ex. via .env)
migrate:
	bun run db:migrate

## Génère une nouvelle migration à partir du schéma (DATABASE_URL requis)
migrate-generate:
	bun run db:generate

## Enregistre les slash commands sur Discord
deploy-commands:
	bun run deploy-commands

## Ouvre Drizzle Studio
studio:
	bun run db:studio
