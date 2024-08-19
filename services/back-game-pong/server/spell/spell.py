import asyncio


class Spell:
    def __init__(self, spell_id, cooldown):
        self._spell_id = spell_id
        self._cooldown = cooldown
        self._is_on_cooldown = False
        self._statement = 0

    def perform_executor(self, game, player):
        raise NotImplementedError("This method need to be implemented.")

    def on_hit(self, ball, game):
        raise NotImplementedError("This method need to be implemented.")

    def destructor(self, ball, game):
        raise NotImplementedError("This method need to be implemented.")

    def send_spell_message_to_players(self, game, data_values):
        game.send_message_to_game("launchSpell", data_values)

    def executor(self, player, game):
        if self._is_on_cooldown:
            return
        #statsincrease
        self.perform_executor(game, player)
        self._is_on_cooldown = True
        asyncio.create_task(self.spell_cooldown_run())

    async def spell_cooldown_run(self):
        await asyncio.sleep(self._cooldown)
        self._is_on_cooldown = False

    def get_spell_id(self):
        return self._spell_id
