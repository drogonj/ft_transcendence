export default function Statistics() {
	this.score = 0;
	this.touchedBalls = 0;
	this.usedSpells = 0;
	this.timeWithoutTakingGoals = [0, 0];
	this.goalsInARow = [0, 0];
}

Statistics.prototype.increaseScore = function () {
	this.score++;
}

Statistics.prototype.increaseTouchedBall = function () {
	this.touchedBalls++;
}

Statistics.prototype.increaseUsedSpells = function () {
	this.usedSpells++;
}

Statistics.prototype.increaseTimeWithoutTakingGoals = function () {
	this.timeWithoutTakingGoals[1]++;
}

Statistics.prototype.resetTimeWithoutTakingGoals = function () {
	if (this.timeWithoutTakingGoals[1] > this.timeWithoutTakingGoals[0])
		this.timeWithoutTakingGoals[0] = this.timeWithoutTakingGoals[1];
	this.timeWithoutTakingGoals[1] = 0;
}

Statistics.prototype.resetGoalsInARow = function () {
	if (this.goalsInARow[1] > this.goalsInARow[0])
		this.goalsInARow[0] = this.goalsInARow[1];
	this.goalsInARow[1] = 0;
}

Statistics.prototype.increaseGoalsInARow = function () {
	this.goalsInARow[1]++;
}

Statistics.prototype.getScore = function () {
	return this.score;
}

Statistics.prototype.getAllStatisticsAsArray = function () {
	return [this.score, this.touchedBalls, this.usedSpells, this.timeWithoutTakingGoals[0], this.goalsInARow[0]];
}
