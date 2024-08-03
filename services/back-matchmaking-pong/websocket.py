import asyncio
import json

import websockets


class WebSocketClient:
    game_server = None

    def __init__(self, uri):
        self.uri = uri
        self.websocket = None

    async def connect(self):
        self.websocket = await websockets.connect(self.uri)
        print("Connection with game server established.")

    async def send(self, message_type, values):
        data = {"type": message_type, "values": values}
        await self.websocket.send(json.dumps(data))

    async def receive(self):
        if self.websocket:
            response = await self.websocket.recv()
            print(f"Message received from the server: {response}")
            return response

    async def run(self):
        await self.connect()
        await self.send("Hello, server!")
        await self.receive()
        # Keep the connection open for further communication
        while True:
            await asyncio.sleep(1)  # Keep the connection alive (or replace with actual logic)


def get_game_server():
    return WebSocketClient.game_server
