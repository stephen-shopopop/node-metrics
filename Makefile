#!make

## Set 'bash' as default shell
SHELL := $(shell which bash)

## Set 'help' target as the default goal
.DEFAULT_GOAL := help

## Test if the dependencies we need to run this Makefile are installed
NPM := $(shell command -v npm)

## Versions
APP_NAME = $(shell node -p "require('./package.json').name")
NODE ?= $(shell cat $(PWD)/.nvmrc 2> /dev/null || echo v20)
NVM = v0.39.5

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

.PHONY: run
run:
	@. $(NVM_DIR)/nvm.sh && nvm use $(NODE) && $(CMD)

.PHONY: task
task: requirements ## Run node task with good version ex: make task link
	@make run CMD="npm run $(filter-out $@,$(MAKECMDGOALS))"

.PHONY: install/nvm
install/nvm: ## Install nvm: restart your terminal after nvm install
	curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/${NVM}/install.sh | bash

.PHONY: install/globals
install/globals: requirements ## Install global dependencies (ex: yarn)
	@echo "📦 Installing globals dependencies..."
	@make run CMD="npm i @antfu/ni -g"

.PHONY: install
install: requirements ## Install the project
	@echo "🍿 Installing dependencies..."
	@make run CMD="npx simple-git-hooks"
	@make run CMD="npm install"
