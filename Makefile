clean:
	@docker compose down
	@docker system prune -f
	@sudo rm -rf services/volumes/ || true
	@docker volume rm ft_transcendence_tmp || true
	@docker volume rm ft_transcendence_django || true
	@docker volume rm ft_transcendence_nginx || true

up:
	@docker compose up

upb:
	@docker compose up --build

down:
	@docker compose down

execdb:
	@docker exec -it postgres psql -d postgres

execuser:
	@docker exec -it user-management bash

re : clean upb

