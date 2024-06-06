clean:
	@docker compose down
	@docker system prune -f
	@sudo rm -rf services/volumes/ || true
	@docker volume rm ft_transcendence_tmp || true

up:
	@docker compose up --build

fclean: clean
	@sudo docker image rm -f $(docker images -q)

execdb:
	@docker exec -it postgres bash

execuser:
	@docker exec -it user-management bash

