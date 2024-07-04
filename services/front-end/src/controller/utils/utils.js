import {getRandomNumber} from "./math_utils.js";

export function shuffle(array) {
	let currIndex = array.length;
	let randomIndex;

	while(currIndex !== 0) {
		randomIndex =  getRandomNumber(0, currIndex);
		currIndex--;
		[array[currIndex], array[randomIndex]] = [array[randomIndex], array[currIndex]];
	}
}

export function newImage(imagePath, id, className) {
	const img = new Image();

	img.onerror = function() {
		throw new Error(`Failed to load image ` + imagePath);
	};

	img.src = imagePath;
	img.setAttribute('id', id);
	img.setAttribute('draggable', "false");
	if (className)
		img.classList.add(className);
	return img;
}