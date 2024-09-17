import asyncio
from chat_game import WebSocketClient, get_game_server

# async def main():
# 	while True:
# 		await asyncio.sleep(1)

if __name__ == "__main__":
	game_ws_client = WebSocketClient("ws://back-game:2605/ws/back")
	asyncio.run(game_ws_client.connect())
	# asyncio.run(main())
