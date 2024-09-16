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
		self.websocket = await websockets.connect(self.uri, extra_headers={"server": "Chat"})
		print("Connection with game server established.")
		asyncio.ensure_future(self.close_handle())

	async def send(self, message_type, values):
		data = {"type": message_type, "values": values}
		try:
			await self.websocket.send(json.dumps(data))
		except (ConnectionClosed, WebSocketException) as e:
			print(f"Failed to send message: {e}")
			self.websocket = None

	async def close_handle(self):
		await self.websocket.wait_closed()
		self.websocket = None
		print("Connection with game server lost..")

	def is_connected(self):
		return self.websocket is not None

def get_game_server():
	return WebSocketClient.game_server