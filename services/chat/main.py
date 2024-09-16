import asyncio
from chat_game import WebSocketClient, get_game_server

async def main():
	while True:
		await asyncio.sleep(1)

if __name__ == "__main__":
	WebSocketClient("ws://back-game:2605/ws/back")
	get_game_server().connect()
	asyncio.run(main())
