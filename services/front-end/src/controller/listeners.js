export let keyDown = {};

export default function loadListeners() {
	document.addEventListener("keydown", function (e) {
		keyDown[e.key] = true;
	});
	document.addEventListener("keyup", function (e) {
		keyDown[e.key] = false;
	});
}