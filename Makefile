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

# Wszystkie komendy wykonywane są w kontenerze web-dev (node_modules i .next
# trzymane w wolumenach Dockera), więc na hoście potrzebny jest tylko Docker.
DC       := docker compose
RUN      := $(DC) run --rm web-dev
RUN_PROD := $(DC) run --rm -e NODE_ENV=production web-dev

##@ Rozwój (w Dockerze)
.PHONY: install
install: ## Instaluje zależności (pnpm) w wolumenie node_modules
	$(RUN) pnpm install

.PHONY: dev
dev: ## Uruchamia Next.js w trybie dev z hot-reloadem (port 3000)
	$(DC) up --build web-dev

.PHONY: build
build: ## Buduje produkcyjną wersję aplikacji
	$(RUN_PROD) pnpm build

.PHONY: start
start: ## Uruchamia produkcyjny serwer Next.js (wymaga make build, port 3000)
	$(RUN_PROD) --service-ports pnpm start

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
shell: ## Otwiera powłokę w kontenerze deweloperskim
	$(RUN) sh

.PHONY: clean
clean: ## Czyści cache i katalogi buildów (.next, out, dist)
	@echo "$(YELLOW)Czyszczenie buildów i cache...$(RESET)"
	$(RUN) sh -c 'rm -rf .next/* out dist'
	@echo "$(GREEN)Wyczyszczono!$(RESET)"

.PHONY: clean-all
clean-all: ## Usuwa kontenery, wolumeny (node_modules, .next) i obrazy projektu
	@echo "$(RED)Usuwanie kontenerów, wolumenów i obrazów...$(RESET)"
	$(DC) --profile dev down -v --rmi local
	@echo "$(GREEN)Wyczyszczono wszystko!$(RESET)"

##@ Kontenery
.PHONY: image
image: ## Buduje produkcyjny obraz Dockera
	$(DC) build web

.PHONY: up
up: ## Uruchamia produkcyjną aplikację w tle (port 3000)
	$(DC) up -d web

.PHONY: down
down: ## Zatrzymuje kontenery
	$(DC) --profile dev down

.PHONY: logs
logs: ## Wyświetla logi kontenerów na żywo
	$(DC) --profile dev logs -f

.PHONY: restart
restart: ## Restartuje kontenery
	$(DC) --profile dev restart
