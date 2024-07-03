const root = document.querySelector(":root");

export function setPropertyColor(property, color) {
	root.style.setProperty(property, color);
}

export function getPropertyColor(property) {
	return getComputedStyle(root).getPropertyValue(property)
}