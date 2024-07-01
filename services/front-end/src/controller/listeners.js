export let keyDown = new Map();

export default function loadListeners() {
	document.addEventListener("keydown", function (e) {
		keyDown.set(e.key, true)
	});
	document.addEventListener("keyup", function (e) {
		keyDown.delete(e.key);
	});
}