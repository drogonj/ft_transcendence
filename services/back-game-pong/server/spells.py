class Spell:
	spells_list = []

	def __init__(self, spell_name, cooldown):
		self.__spell_name = spell_name
		self.__cooldown = cooldown

