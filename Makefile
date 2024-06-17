clean:
	@docker compose down
	@docker system prune -f
	@sudo rm -rf services/volumes/ || true
	@docker volume rm ft_transcendence_django || true
	@docker volume rm ft_transcendence_nginx || true

up:
	@docker compose up

upb:
	@docker compose up --build

down:
	@docker compose down

execdb:
	@docker exec -it postgres psql -U user -d postgres

execuser:
	@docker exec -it user-management bash

createsuperuser:
	@python manage.py createsuperuser

re : clean upb

