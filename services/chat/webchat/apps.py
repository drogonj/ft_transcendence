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
        #verifie si le chat est connnecter au server game, sinon essayera de le connecter avec la fonction connect()
        await check_game_server_health()
        await asyncio.sleep(5)


def run_async_loop(loop):
    #definir l'event loop qu'on veut utiliser
    asyncio.set_event_loop(loop)
    #run de maniere infini la fonction main_loop, "run_until_complete" est totalement sync et bloquant
    #cependant, puisque executer dans un autre thread ce n'est pas un probleme (d'ou l'interet de faire un autre thread)
    loop.run_until_complete(main_loop())


class WebchatConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'webchat'

    #function call quand manage.py call (peut etre considerer comme un main donc)
    def ready(self):
        print("Run django Ready function")
        #Instance de l'objet permettant la creation et la com via websocket
        WebSocketClient("ws://back-game:2605/ws/back")

        #creation d'une event loop
        loop = asyncio.new_event_loop()
        #creation d'un nouveau thread, qui executera en main run_async_loop, et qui prend la event loop en argument
        thread = threading.Thread(target=run_async_loop, args=(loop,))
        #Si le process principal (django) est kill le thread est kill aussi
        thread.daemon = True
        #lancer le thread
        thread.start()


#Problemes potentiel:
#
# 1 selon la doc: https://docs.djangoproject.com/en/5.1/ref/applications/
#"ready might be called more than once" Le django etant setup bizzarement le ready est call plusieurs fois (6 fois, 5 instances et 1 instance de test)
#Ce qui peut potentiellement faire des problemes (aucun a ce que je sais)

# 2 j'utilise new_event_loop et non pas le get_event_loop (donc la loop courante) car d'apres stackoverflow il peut
# y avoir des problemes et conflits avec daphne si les configs sont mal gere (ou autres libs ASYNC tornado etc)