# DataShare — shortcuts for an already configured local environment.
.DEFAULT_GOAL := help

.PHONY: help up down ps logs health qa qa-backend qa-frontend status dozzle-up dozzle-stop https-up https-health https-off

help:
	@printf '%s\n' 'make up          Start the local stack' \
	  'make down        Stop and remove containers (keep volumes)' \
	  'make ps          Show service status' \
	  'make logs        Follow recent logs (Ctrl-C to exit)' \
	  'make health      Check the local API' \
	  'make qa          Run Laravel/Pint and Angular tests/build' \
	  'make qa-backend  Run Laravel tests and Pint' \
	  'make qa-frontend Run Angular tests and build' \
	  'make status      Check local/remote Git synchronization' \
	  'make dozzle-up   Start the optional local log viewer' \
	  'make dozzle-stop Stop the log viewer' \
	  'make https-up    Start the local stack with HTTPS (requires local certificates)' \
	  'make https-health Check HTTPS and verify the local CA' \
	  'make https-off   Restore the HTTP-only local stack'

up:
	docker compose up -d

down:
	docker compose down

ps:
	docker compose ps

logs:
	docker compose logs --tail=100 --follow

health:
	curl -fsSL http://127.0.0.1:8080/api/health

qa:
	bash scripts/qa.sh all

qa-backend:
	bash scripts/qa.sh backend

qa-frontend:
	bash scripts/qa.sh frontend

status:
	bash scripts/qa.sh status

dozzle-up:
	docker compose up -d dozzle

dozzle-stop:
	docker compose stop dozzle

https-up:
	@test -s docker/nginx/certs/datashare.pem && test -s docker/nginx/certs/datashare-key.pem || { echo 'Generate the local certificates first (see installation guide).' >&2; exit 1; }
	docker compose -f compose.yaml -f compose.https.yaml up -d

https-health:
	curl -fsS --cacert "$$(mkcert -CAROOT)/rootCA.pem" https://127.0.0.1:8443/api/health

https-off:
	docker compose -f compose.yaml up -d app web
