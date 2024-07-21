export default function Statistics() {
	this.score = 0;
	this.touchedBalls = 0;
	this.usedSpells = 0;
	this.timeWithoutTakingGoals = 0;
	this.goalsInARow = 0;
	this.spellsEfficiency = 0;
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
	this.timeWithoutTakingGoals++;
}

Statistics.prototype.increaseGoalsInARow = function () {
	this.goalsInARow++;
}

Statistics.prototype.increaseSpellsEfficiency = function () {
	this.spellsEfficiency++;
}

Statistics.prototype.getScore = function () {
	return this.score;
}

Statistics.prototype.getAllStatisticsAsArray = function () {
	return [this.score, this.touchedBalls, this.usedSpells, this.timeWithoutTakingGoals, this.goalsInARow, this.spellsEfficiency];
}
