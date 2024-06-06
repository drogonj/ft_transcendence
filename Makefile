clean:
	@docker compose down
	@docker system prune -f
	@sudo rm -rf services/volumes/ || true
	@docker volume rm ft_transcendence_tmp || true

up:
	@docker compose up

upb:
	@docker compose up --build

down:
	@docker compose down

execdb:
	@docker exec -it postgres psql -U chabrune -d postgres

execuser:
	@docker exec -it user-management bash

