class Statistics:
	def __init__(self):
		self.score = 0
		self.touched_balls = 0
		self.used_spells = 0
		self.time_without_taking_goals = [0, 0]
		self.goals_in_row = [0, 0]

	def increase_time_without_taking_goals(self):
		self.time_without_taking_goals[1] += 1

	def increase_goals_in_row(self):
		self.goals_in_row[1] += 1

	def reset_time_without_taking_goals(self):
		if self.time_without_taking_goals[1] > self.time_without_taking_goals[0]:
			self.time_without_taking_goals[0] = self.time_without_taking_goals[1]
			self.time_without_taking_goals[1] = 0

	def reset_goals_in_row(self):
		if self.goals_in_row[1] > self.goals_in_row[0]:
			self.goals_in_row[0] = self.goals_in_row[1]
			self.goals_in_row[1] = 0

	def get_statistics_as_list(self):
		return [self.score, self.touched_balls, self.used_spells, self.time_without_taking_goals[0], self.goals_in_row[0]]
