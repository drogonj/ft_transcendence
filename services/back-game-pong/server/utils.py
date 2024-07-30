import random


def get_random_number_between(min_val, max_val):
	return random.randrange(min_val, max_val, 1)


def get_random_number_with_decimal(min_val, max_val):
	return random.randrange(min_val, max_val)/100


def reverse_side(side):
	return "Right" if side == "Left" else "Left"
