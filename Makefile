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
	@echo "$(BOLD)$(CYAN)WUD Szczecin - Next.js + TypeScript + Docker$(RESET)"
	@echo ""
	@echo "$(YELLOW)Użycie:$(RESET) make $(GREEN)<target>$(RESET)"
	@echo ""
	@awk 'BEGIN {FS = ":.*##"; printf ""} \
		/^[a-zA-Z0-9_-]+:.*?##/ { printf "  $(GREEN)%-18s$(RESET) %s\n", $$1, $$2 } \
		/^##@/ { printf "\n$(BOLD)%s$(RESET)\n", substr($$0, 5) } ' $(MAKEFILE_LIST)
	@echo ""

##@ Rozwój lokalny (Local Development)
.PHONY: install
install: ## Instaluje wszystkie zależności projektu (pnpm)
	pnpm install

.PHONY: dev
dev: ## Uruchamia aplikację Next.js w trybie dev (port 3000)
	pnpm dev

.PHONY: build
build: ## Buduje produkcyjną wersję aplikacji
	pnpm build

.PHONY: start
start: ## Uruchamia produkcyjny serwer Next.js
	pnpm start

.PHONY: lint
lint: ## Uruchamia linter ESLint
	pnpm lint

.PHONY: check-types
check-types: ## Sprawdza typy TypeScript
	pnpm check-types

.PHONY: format
format: ## Formatuje kod za pomocą Prettier
	pnpm format

.PHONY: check
check: lint check-types build ## Pełny test jakości: lint + types + build

.PHONY: clean
clean: ## Czyści cache i katalogi buildów (.next, out, dist)
	@echo "$(YELLOW)Czyszczenie buildów i cache...$(RESET)"
	rm -rf .next out dist
	@echo "$(GREEN)Wyczyszczono!$(RESET)"

.PHONY: clean-all
clean-all: clean ## Czyści wszystko włącznie z node_modules
	@echo "$(RED)Usuwanie node_modules...$(RESET)"
	rm -rf node_modules
	@echo "$(GREEN)Wyczyszczono wszystko!$(RESET)"

##@ Docker
.PHONY: docker-build
docker-build: ## Buduje produkcyjny obraz Dockera
	docker compose build web

.PHONY: docker-up
docker-up: ## Uruchamia aplikację w Dockerze w tle (port 3000)
	docker compose up -d web

.PHONY: docker-down
docker-down: ## Zatrzymuje kontenery Dockera
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
