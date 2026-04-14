.PHONY: up down logs restart rebuild clean seed-check

# ── Start everything ──────────────────────────────────────────────────────────
up:
	@echo "🌦️  Starting MeroMausam..."
	cp -n .env.example .env 2>/dev/null || true
	docker compose up -d
	@echo ""
	@echo "✅ MeroMausam is starting!"
	@echo "   → Web UI:    http://localhost"
	@echo "   → API:       http://localhost/api/health"
	@echo "   → Backend:   http://localhost:3001/health"
	@echo ""
	@echo "⏳ First run takes ~3 minutes to fetch weather data."
	@echo "   Watch progress with: make logs"

# ── Stop ─────────────────────────────────────────────────────────────────────
down:
	docker compose down

# ── Logs ─────────────────────────────────────────────────────────────────────
logs:
	docker compose logs -f --tail=50

logs-backend:
	docker compose logs -f backend --tail=100

logs-frontend:
	docker compose logs -f frontend --tail=50

# ── Restart single service ───────────────────────────────────────────────────
restart-backend:
	docker compose restart backend

restart-frontend:
	docker compose restart frontend

# ── Rebuild from scratch ─────────────────────────────────────────────────────
rebuild:
	docker compose down
	docker compose build --no-cache
	docker compose up -d

# ── Check data ───────────────────────────────────────────────────────────────
seed-check:
	@echo "📊 Checking district count..."
	docker compose exec db psql -U meromausam -d meromausam -c "SELECT COUNT(*) as districts FROM districts;"
	@echo "📊 Checking forecast count..."
	docker compose exec db psql -U meromausam -d meromausam -c "SELECT COUNT(*) as forecasts FROM forecasts;"
	@echo "📊 Checking active alerts..."
	docker compose exec db psql -U meromausam -d meromausam -c "SELECT COUNT(*) as alerts FROM weather_alerts WHERE is_active = true;"

# ── Manual data refresh ──────────────────────────────────────────────────────
refresh:
	@echo "🔄 Triggering manual data refresh..."
	curl -s http://localhost/api/health | python3 -m json.tool

# ── Clean everything including volumes ──────────────────────────────────────
clean:
	@echo "⚠️  This will delete ALL data including weather history!"
	@read -p "Are you sure? [y/N] " confirm && [ "$$confirm" = "y" ] || exit 1
	docker compose down -v
	@echo "🧹 Clean complete"

# ── Database shell ───────────────────────────────────────────────────────────
db-shell:
	docker compose exec db psql -U meromausam -d meromausam

# ── Status ───────────────────────────────────────────────────────────────────
status:
	docker compose ps
