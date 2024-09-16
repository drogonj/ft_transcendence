import asyncio
from chat_game import init_websocket_client

async def main():
    await init_websocket_client()
    print("WebSocket client started.")

if __name__ == "__main__":
    asyncio.run(main())
