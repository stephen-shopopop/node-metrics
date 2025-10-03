#!make

## Set 'bash' as default shell
SHELL := $(shell which bash)

## Set 'help' target as the default goal
.DEFAULT_GOAL := help

## Test if the dependencies we need to run this Makefile are installed
NPM := $(shell command -v npm)

## Versions
NODE ?= $(shell cat $(PWD)/.nvmrc 2> /dev/null || echo v24)

.PHONY: help
help: ## Show this help
	@echo 'Usage: make [target] ...'
	@echo ''
	@echo 'targets:'
	@egrep -h '^[a-zA-Z0-9_\/-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort -d | awk 'BEGIN {FS = ":.*?## "; printf "Usage: make \033[0;34mTARGET\033[0m \033[0;35m[ARGUMENTS]\033[0m\n\n"; printf "Targets:\n"}; {printf "  \033[33m%-25s\033[0m \033[0;32m%s\033[0m\n", $$1, $$2}'

.PHONY: requirements
requirements: ## Check if the requirements are satisfied
ifndef NPM
	@echo "📦🧩 npm is not available. Please install npm."
	@exit 1
endif
	@echo "🆗 The necessary dependencies are already installed!"

.PHONY: install
install: ## 📦 Installing globals dependencies... (mise)
	@echo "🍿 Installing dependencies for mac with homebrew (https://brew.sh)... "
	@brew install mise
	@echo "🔰 ......................."
	@echo "echo 'eval \"\$$(mise activate zsh)\"' >> ~/.zshrc"
	@echo "echo 'alias mr=\"mise run\"' >> ~/.zshrc"
	@echo "🔰 ......................."

.PHONY: deps
deps: requirements ## 📦 Install project dependencies
	@echo "📦 Installing project dependencies..."
	@npm install

.PHONY: build
build: ## 🔨 Build the project
	@echo "🔨 Building project..."
	@npm run build

.PHONY: clean
clean: ## 🧹 Clean build artifacts
	@echo "🧹 Cleaning build artifacts..."
	@npm run clean

.PHONY: test
test: ## 🧪 Run tests
	@echo "🧪 Running tests..."
	@npm test

.PHONY: lint
lint: ## 🔍 Lint code
	@echo "🔍 Linting code..."
	@npm run lint

.PHONY: format
format: ## 💅 Format code
	@echo "💅 Formatting code..."
	@npm run format

.PHONY: check
check: ## ✅ Run all checks (TypeScript, lint, HTML)
	@echo "✅ Running all checks..."
	@npm run check

.PHONY: maintenance
maintenance: ## 🧰 Run maintenance tasks
	@echo "🧰 Running maintenance tasks..."
	@npm run maintenance

.PHONY: bench
bench: ## 🚀 Run benchmark
	@echo "🚀 Running benchmark..."
	@npm run bench

.PHONY: docs
docs: ## 📚 Generate documentation
	@echo "📚 Generating documentation..."
	@npm run docs

.PHONY: deps-update
deps-update: ## ⬆️ Update dependencies
	@echo "⬆️ Updating dependencies..."
	@npm run deps:update

.PHONY: deps-unused
deps-unused: ## 🔎 Check for unused dependencies
	@echo "🔎 Checking for unused dependencies..."
	@npm run deps:unused

.PHONY: docker-up
docker-up: ## 🐳 Start Docker compose and run app
	@echo "🐳 Starting Docker compose..."
	@docker compose -f compose.yml up -d
	@sleep 2
	@echo "🚀 Running sample app..."
	@node -r ./bin/metrics.js example/sample.js

.PHONY: docker-down
docker-down: ## 🛑 Stop Docker compose
	@echo "🛑 Stopping Docker compose..."
	@docker compose -f compose.yml down --rmi local --volumes --remove-orphans

.PHONY: docker-prune
docker-prune: ## 🧹 Prune Docker builder cache
	@echo "🧹 Pruning Docker builder cache..."
	@docker builder prune -a && docker image prune && docker network prune

.PHONY: publish-dry-run
publish-dry-run: ## 📦 Test publish package (dry-run)
	@echo "📦 Testing package publish..."
	@npm run publish:dry-run

.PHONY: tarball-check
tarball-check: ## 📦 Check package tarball
	@echo "📦 Checking package tarball..."
	@npm run tarball:check
