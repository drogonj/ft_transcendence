import asyncio
from chat_game import WebSocketClient

async def initialize_game_server(uri):
	game_server = WebSocketClient(uri)
	await game_server.connect()

if __name__ == "__main__":
	uri = "ws://back-game:2605/ws/back"
	asyncio.run(initialize_game_server(uri))