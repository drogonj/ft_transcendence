export function getRandomNumber(min, max) {
	return (Math.random() * (max - min) + min);
}

export function getRandomNumberWithDecimal(min, max) {
	return (Math.random() * (max - min) + min).toFixed(2);
}

export function getRandomNumberBetweenOne() {
	return Math.random() < 0.5 ? -1 : 1;
}