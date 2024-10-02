import asyncio
import json

import websockets
from websockets.exceptions import (
    ConnectionClosedError,
    InvalidURI,
    InvalidHandshake,
    WebSocketException
)
from asyncio import TimeoutError


class WebSocketClient:
    game_server = None

    def __init__(self, uri):
        self.uri = uri
        self.websocket = None
        WebSocketClient.game_server = self

    async def connect(self):
        self.websocket = await websockets.connect(self.uri, extra_headers={"server": "Tournament"})
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


async def bind_to_game_server():
    print("Try connecting to the game server..")
    try:
        await asyncio.wait_for(get_game_server().connect(), timeout=3)
    except (OSError, InvalidURI, InvalidHandshake, ConnectionClosedError, WebSocketException) as e:
        print(f"Failed to connect: {e}")
    except TimeoutError:
        print("Connection attempt timed out after 3 seconds.")


async def check_game_server_health():
    if not get_game_server().is_connected():
        await bind_to_game_server()
        return False
    return True
