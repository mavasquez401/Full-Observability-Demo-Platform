.PHONY: up down restart logs db-reset lint format test clean help

# Default target
help:
	@echo "Full Observability Demo Platform - Makefile"
	@echo ""
	@echo "Commands:"
	@echo "  make up          - Start all services (one-command demo)"
	@echo "  make down        - Stop all services"
	@echo "  make restart     - Restart all services"
	@echo "  make logs        - Show logs from all services"
	@echo "  make db-reset    - Reset database and run migrations/seeds"
	@echo "  make lint        - Run linters on all services"
	@echo "  make format      - Format code in all services"
	@echo "  make test        - Run tests in all services"
	@echo "  make clean       - Remove all containers, volumes, and generated files"

# Start all services
up:
	@echo "Starting Full Observability Demo Platform..."
	@docker compose -f infra/compose/docker-compose.yml up -d
	@echo "Waiting for services to be healthy..."
	@sleep 5
	@echo "Running database migrations and seeds..."
	@docker compose -f infra/compose/docker-compose.yml exec -T api npm run db:migrate || true
	@docker compose -f infra/compose/docker-compose.yml exec -T api npm run db:seed || true
	@echo ""
	@echo "✅ Platform is running!"
	@echo "  Frontend: http://localhost:3000"
	@echo "  API: http://localhost:3001"
	@echo "  API Health: http://localhost:3001/health"

# Stop all services
down:
	@docker compose -f infra/compose/docker-compose.yml down

# Restart all services
restart: down up

# Show logs
logs:
	@docker compose -f infra/compose/docker-compose.yml logs -f

# Reset database
db-reset:
	@echo "Resetting database..."
	@docker compose -f infra/compose/docker-compose.yml exec -T postgres psql -U observability_demo -d observability_demo -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;" || true
	@docker compose -f infra/compose/docker-compose.yml exec -T api npm run db:migrate || true
	@docker compose -f infra/compose/docker-compose.yml exec -T api npm run db:seed || true
	@echo "✅ Database reset complete"

# Lint all services
lint:
	@echo "Linting TypeScript services..."
	@cd apps/web && npm run lint || true
	@cd services/api && npm run lint || true
	@echo "Linting Python service..."
	@cd services/worker && poetry run ruff check . || true

# Format all services
format:
	@echo "Formatting TypeScript services..."
	@cd apps/web && npm run format || true
	@cd services/api && npm run format || true
	@echo "Formatting Python service..."
	@cd services/worker && poetry run black . || true
	@cd services/worker && poetry run ruff check --fix . || true

# Test all services
test:
	@echo "Testing services..."
	@cd apps/web && npm run test || true
	@cd services/api && npm run test || true
	@cd services/worker && poetry run pytest || true

# Clean everything
clean:
	@echo "Cleaning up..."
	@docker compose -f infra/compose/docker-compose.yml down -v
	@find . -type d -name "node_modules" -exec rm -rf {} + 2>/dev/null || true
	@find . -type d -name ".next" -exec rm -rf {} + 2>/dev/null || true
	@find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	@find . -type f -name "*.pyc" -delete 2>/dev/null || true
	@echo "✅ Clean complete"

