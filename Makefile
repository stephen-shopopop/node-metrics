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
	@echo "echo 'eval "$(mise activate zsh)"' >> ~/.zshrc"
	@echo "echo 'alias mr="mise run"' >> ~/.zshrc"
	@echo "🔰 ......................."
