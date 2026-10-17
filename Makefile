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
	@echo "$(BOLD)$(CYAN)WUD Szczecin - Monorepo (Next.js + TypeScript + Docker)$(RESET)"
	@echo ""
	@echo "$(YELLOW)Użycie:$(RESET) make $(GREEN)<target>$(RESET)"
	@echo ""
	@awk 'BEGIN {FS = ":.*##"; printf ""} \
		/^[a-zA-Z0-9_-]+:.*?##/ { printf "  $(GREEN)%-18s$(RESET) %s\n", $$1, $$2 } \
		/^##@/ { printf "\n$(BOLD)%s$(RESET)\n", substr($$0, 5) } ' $(MAKEFILE_LIST)
	@echo ""

##@ Rozwój lokalny (Local Development)
.PHONY: install
install: ## Instaluje wszystkie zależności monorepo (pnpm)
	pnpm install

.PHONY: dev
dev: ## Uruchamia wszystkie aplikacje monorepo w trybie dev
	pnpm dev

.PHONY: dev-web
dev-web: ## Uruchamia tylko aplikację web w trybie dev (port 3000)
	pnpm --filter=web dev

.PHONY: dev-docs
dev-docs: ## Uruchamia tylko aplikację docs w trybie dev (port 3001)
	pnpm --filter=docs dev

.PHONY: build
build: ## Buduje wszystkie aplikacje i pakiety monorepo
	pnpm build

.PHONY: lint
lint: ## Uruchamia linter we wszystkich pakietach
	pnpm lint

.PHONY: check-types
check-types: ## Sprawdza typy TypeScript we wszystkich pakietach
	pnpm check-types

.PHONY: format
format: ## Formatuje pliki za pomocą Prettiera
	pnpm format

.PHONY: check
check: lint check-types build ## Pełny test jakości: lint + types + build

.PHONY: clean
clean: ## Czyści cache, katalogi buildów (.next, .turbo, dist, out)
	@echo "$(YELLOW)Czyszczenie buildów i cache...$(RESET)"
	rm -rf .turbo
	rm -rf apps/*/.next
	rm -rf apps/*/dist
	rm -rf packages/*/dist
	rm -rf out
	@echo "$(GREEN)Wyczyszczono!$(RESET)"

.PHONY: clean-all
clean-all: clean ## Czyści wszystko włącznie z node_modules
	@echo "$(RED)Usuwanie node_modules...$(RESET)"
	rm -rf node_modules apps/*/node_modules packages/*/node_modules
	@echo "$(GREEN)Wyczyszczono wszystko!$(RESET)"

##@ Docker
.PHONY: docker-build
docker-build: ## Buduje produkcyjny obraz Dockera dla web
	docker compose build web

.PHONY: docker-up
docker-up: ## Uruchamia aplikację w Dockerze w tle (port 3000)
	docker compose up -d web

.PHONY: docker-down
docker-down: ## Zatrzymuje i usuwa kontenery Dockera
	docker compose --profile dev down

.PHONY: docker-logs
docker-logs: ## Wyświetla logi kontenera na żywo
	docker compose logs -f

.PHONY: docker-restart
docker-restart: ## Restartuje kontenery Dockera
	docker compose restart

.PHONY: docker-dev
docker-dev: ## Uruchamia kontener w trybie dev z hot-reloadem
	docker compose --profile dev up --build web-dev

.PHONY: docker-clean
docker-clean: docker-down ## Usuwa kontenery, wolumeny i obrazy projektu
	docker compose --profile dev down -v --rmi local
