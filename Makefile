.DEFAULT_GOAL := help

.PHONY: help setup install dev build start lint typecheck clean clean-all

help:
	@echo "Problem Coach Makefile"
	@echo ""
	@echo "Targets:"
	@echo "  setup       Install dependencies"
	@echo "  install     Alias for setup"
	@echo "  dev         Run the dev server"
	@echo "  build       Build the production app"
	@echo "  start       Start the production server"
	@echo "  lint        Run Next.js lint"
	@echo "  typecheck   Run TypeScript typecheck"
	@echo "  clean       Remove build artifacts"
	@echo "  clean-all   Remove build artifacts + node_modules"

setup:
	npm install

install: setup

dev:
	npm run dev

build:
	npm run build

start:
	npm run start

lint:
	npm run lint

typecheck:
	npx tsc --noEmit

clean:
	rm -rf .next out

clean-all: clean
	rm -rf node_modules
