.DEFAULT_GOAL := help

# Colors for terminal styling
CYAN   := \033[36m
GREEN  := \033[32m
YELLOW := \033[33m
RED    := \033[31m
RESET  := \033[0m
BOLD   := \033[1m

##@ Pomoc
.PHONY: help
help: ## Wyświetla listę dostępnych komend
	@echo ""
	@echo "$(BOLD)$(CYAN)WUD Szczecin - Next.js + Go + Docker$(RESET)"
	@echo ""
	@echo "$(YELLOW)Użycie:$(RESET) make $(GREEN)<target>$(RESET)"
	@echo ""
	@awk 'BEGIN {FS = ":.*##"; printf ""} \
		/^[a-zA-Z0-9_-]+:.*?##/ { printf "  $(GREEN)%-18s$(RESET) %s\n", $$1, $$2 } \
		/^##@/ { printf "\n$(BOLD)%s$(RESET)\n", substr($$0, 5) } ' $(MAKEFILE_LIST)
	@echo ""

# Wszystkie komendy wykonywane są w kontenerach Dockera (node_modules, .next
# i cache Go trzymane w wolumenach), więc na hoście potrzebny jest tylko Docker.
DC       := docker compose
RUN      := $(DC) run --rm web
RUN_PROD := $(DC) run --rm -e NODE_ENV=production web
GO       := $(DC) run --rm api

##@ Frontend Next.js (w Dockerze)
.PHONY: install
install: ## Instaluje zależności (pnpm) w wolumenie node_modules
	$(RUN) pnpm install

.PHONY: dev
dev: ## Uruchamia Next.js z hot-reloadem na pierwszym planie (port 3000)
	$(DC) up --build web

.PHONY: build
build: ## Sprawdza, czy aplikacja buduje się produkcyjnie (pnpm build)
	$(RUN_PROD) pnpm build

.PHONY: lint
lint: ## Uruchamia linter ESLint
	$(RUN) pnpm lint

.PHONY: check-types
check-types: ## Sprawdza typy TypeScript
	$(RUN) pnpm check-types

.PHONY: format
format: ## Formatuje kod za pomocą Prettier
	$(RUN) pnpm format

.PHONY: check
check: lint check-types build ## Pełny test jakości: lint + types + build

.PHONY: shell
shell: ## Otwiera powłokę w kontenerze frontendu
	$(RUN) sh

.PHONY: clean
clean: ## Czyści cache i katalogi buildów (.next, out, dist)
	@echo "$(YELLOW)Czyszczenie buildów i cache...$(RESET)"
	$(RUN) sh -c 'rm -rf .next/* out dist'
	@echo "$(GREEN)Wyczyszczono!$(RESET)"

.PHONY: clean-all
clean-all: ## Usuwa kontenery, wolumeny (node_modules, .next, cache Go) i obrazy projektu
	@echo "$(RED)Usuwanie kontenerów, wolumenów i obrazów...$(RESET)"
	$(DC) down -v --rmi local --remove-orphans
	@echo "$(GREEN)Wyczyszczono wszystko!$(RESET)"

##@ Backend Go (w Dockerze)
.PHONY: api-dev
api-dev: ## Uruchamia backend Go na pierwszym planie (port 8080, zmiany = restart)
	$(DC) up --build api

.PHONY: api-test
api-test: ## Uruchamia testy backendu (go test)
	$(GO) go test ./...

.PHONY: api-vet
api-vet: ## Statyczna analiza backendu (go vet)
	$(GO) go vet ./...

.PHONY: api-fmt
api-fmt: ## Formatuje kod backendu (gofmt)
	$(GO) gofmt -w .

.PHONY: api-tidy
api-tidy: ## Porządkuje zależności (go mod tidy)
	$(GO) go mod tidy

.PHONY: api-check
api-check: api-vet api-test ## Pełny test jakości backendu: vet + testy

.PHONY: api-shell
api-shell: ## Otwiera powłokę w kontenerze backendu
	$(GO) sh

.PHONY: api-health
api-health: ## Sprawdza endpoint /healthz backendu
	@curl -fsS http://localhost:8080/healthz && echo

.PHONY: api-docs
api-docs: ## Otwiera dokumentację API (Swagger UI) w przeglądarce
	@open http://localhost:8080/api/docs 2>/dev/null || xdg-open http://localhost:8080/api/docs 2>/dev/null || echo "http://localhost:8080/api/docs"

##@ Kontenery
.PHONY: image
image: ## Buduje obrazy Dockera (web + api)
	$(DC) build web api

.PHONY: up
up: ## Uruchamia web (:3000) i api (:8080) w tle
	$(DC) up -d --build web api

.PHONY: down
down: ## Zatrzymuje kontenery
	$(DC) down --remove-orphans

.PHONY: logs
logs: ## Wyświetla logi kontenerów na żywo
	$(DC) logs -f

.PHONY: restart
restart: ## Restartuje kontenery
	$(DC) restart
