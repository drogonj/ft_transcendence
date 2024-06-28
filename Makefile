clean:
	@docker compose down
	@docker system prune -f
	@sudo rm -rf services/volumes/ || true
	@docker volume rm $$(docker volume ls -q) || true

fullclean: clean
	@docker image rm $$(docker image ls -q) || true

up:
	@docker compose up

upb:
	@docker compose up --build

buildlog:
	DOCKER_BUILDKIT=0 docker compose build --progress=plain

down:
	@docker compose down

execdb:
	@docker exec -it postgres psql -U user -d postgres

execfront:
	@docker exec -it front-end sh

execuser:
	@docker exec -it user-management bash

createsuperuser:
	@python manage.py createsuperuser

re : clean upb

