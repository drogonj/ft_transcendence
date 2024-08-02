import asyncio
import json

import websockets


class WebSocketClient:
    def __init__(self, uri):
        self.uri = uri
        self.websocket = None

    async def connect(self):
        self.websocket = await websockets.connect(self.uri)
        print("Connected to the server")

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