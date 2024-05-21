up:
	@docker-compose -f ./docker-compose.yml up -d --build

down:
	@docker-compose -f ./docker-compose.yml down

clear:
	@docker-compose -f ./docker-compose.yml rm -f -s