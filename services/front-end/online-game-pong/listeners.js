export let keyDown = new Map();

function key_down(event) {
	keyDown.set(event.code, true)
}

function key_up(event) {
	keyDown.delete(event.code);
}

export function loadListeners() {
	document.addEventListener("keydown", key_down);
	document.addEventListener("keyup", key_up);
}

export function removeListeners() {
	document.removeEventListener("keydown", key_down);
	document.removeEventListener("keyup", key_up);
}