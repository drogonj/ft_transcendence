import json
import asyncio
import websockets
from websockets.exceptions import ConnectionClosed, WebSocketException

class WebSocketClient:
	game_server = None

	def __init__(self, uri):
		self.uri = uri
		self.websocket = None
		WebSocketClient.game_server = self

	async def connect(self):
		retry_attempts = 0
		while True:
			try:
				self.websocket = await websockets.connect(self.uri, extra_headers={"server": "Chat"})
				print("Connection with game server established.")
				asyncio.ensure_future(self.keep_alive())
				asyncio.ensure_future(self.close_handle())
				break
			except (ConnectionClosed, WebSocketException) as e:
				retry_attempts += 1
				wait_time = min(2 ** retry_attempts, 60)
				print(f"Failed to connect: {e}. Retrying in {wait_time} seconds...")
				await asyncio.sleep(wait_time)
			except Exception as e:
				print(f"Unexpected error in connect: {e}")
				await asyncio.sleep(10)

	async def send(self, message_type, values):
		data = {"type": message_type, "values": values}
		try:
			await self.websocket.send(json.dumps(data))
		except (ConnectionClosed, WebSocketException) as e:
			print(f"Failed to send message: {e}")
			self.websocket = None

	async def close_handle(self):
		try:
			await self.websocket.wait_closed()
		except (ConnectionClosed, WebSocketException, asyncio.CancelledError) as e:
			print(f"Connection closed with error: {e}")
		finally:
			self.websocket = None
			print("Connection with game server lost..")

	async def keep_alive(self):
		while True:
			try:
				if self.websocket is None or self.websocket.closed:
					print("WebSocket is not connected. Attempting to reconnect...")
					await self.connect()
				else:
					await self.websocket.ping()
					print("Ping sent. Connection is still on...")
				await asyncio.sleep(5)
			except (ConnectionClosed, WebSocketException) as e:
				print(f"Connection lost: {e}. Reconnecting...")
				await self.connect()
			except Exception as e:
				print(f"Unexpected error in keep_alive: {e}")

	def is_connected(self):
		return self.websocket is not None

def get_game_server():
	return WebSocketClient.game_server