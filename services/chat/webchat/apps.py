from django.apps import AppConfig
from chat_game import WebSocketClient, get_game_server
import threading
import asyncio
from websockets.exceptions import (
	ConnectionClosedError,
	InvalidURI,
	InvalidHandshake,
	WebSocketException
)


async def bind_to_game_server():
	print("Try connecting to the game server..")
	try:
		await get_game_server().connect()
	except (OSError, InvalidURI, InvalidHandshake, ConnectionClosedError, WebSocketException) as e:
		print(f"Failed to connect: {e}")


async def check_game_server_health():
	if not get_game_server().is_connected():
		await bind_to_game_server()
		return False
	return True


async def main_loop():
	while True:
		await check_game_server_health()
		await asyncio.sleep(5)


def run_async_loop(loop):
	asyncio.set_event_loop(loop)
	loop.run_until_complete(main_loop())


class WebchatConfig(AppConfig):
	default_auto_field = 'django.db.models.BigAutoField'
	name = 'webchat'

	def ready(self):
		WebSocketClient("ws://back-game:2605/ws/back")
		loop = asyncio.new_event_loop()
		thread = threading.Thread(target=run_async_loop, args=(loop,))
		thread.daemon = True
		thread.start()
