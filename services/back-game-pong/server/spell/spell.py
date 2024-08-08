import asyncio


class Spell:
    def __init__(self, spell_id, cooldown):
        self.__spell_id = spell_id
        self.__cooldown = cooldown
        self.__is_on_cooldown = False

    def perform_executor(self):
        raise NotImplementedError("This method need to be implemented.")

    def executor(self, player):
        if self.__is_on_cooldown:
            return
        #statsincrease
        player.send_message_to_player("launchSpell", {"spellName": self.__spell_id})
        self.perform_executor()
        asyncio.create_task(self.spell_cooldown_run())

    async def spell_cooldown_run(self):
        self.__is_on_cooldown = True
        await asyncio.sleep(self.__cooldown)
        self.__is_on_cooldown = False
