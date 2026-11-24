# DataShare — shortcuts for an already configured local environment.
.DEFAULT_GOAL := help

.PHONY: help up down ps logs health qa qa-backend qa-frontend status

help:
	@printf '%s\n' 'make up          Start the local stack' \
	  'make down        Stop and remove containers (keep volumes)' \
	  'make ps          Show service status' \
	  'make logs        Follow recent logs (Ctrl-C to exit)' \
	  'make health      Check the local API' \
	  'make qa          Run Laravel/Pint and Angular tests/build' \
	  'make qa-backend  Run Laravel tests and Pint' \
	  'make qa-frontend Run Angular tests and build' \
	  'make status      Check local/remote Git synchronization'

up:
	docker compose up -d

down:
	docker compose down

ps:
	docker compose ps

logs:
	docker compose logs --tail=100 --follow

health:
	curl -fsS http://127.0.0.1:8080/api/health

qa:
	bash scripts/qa.sh all

qa-backend:
	bash scripts/qa.sh backend

qa-frontend:
	bash scripts/qa.sh frontend

status:
	bash scripts/qa.sh status
