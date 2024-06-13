import {navigateTo} from "./contentLoader.js";

export const pages = new Map;
export const htmlFolderPath = "./src/html/"

export default class Page {
	constructor(htmlFileName) {
		this.htmlFileName = htmlFileName;
		this.htmlContent = "";
		this.navigations = [];
		this.listeners = [];
		pages.set(htmlFileName, this);
	}

	render() {
		document.getElementById("app").innerHTML = this.htmlContent;
		this.#loadNavigations();
		this.#loadListeners();
	}

	#loadNavigations() {
		this.navigations.forEach(elementId => {
			const htmlHref = document.getElementById(elementId);
			htmlHref.addEventListener('click', function(event) {
				event.preventDefault();
				navigateTo(htmlHref.href.value);
			});
		})
	}

	#loadListeners() {
		this.listeners.forEach(listenerValues => {
			document.getElementById(listenerValues[0]).addEventListener(listenerValues[1], listenerValues[2]);

		})
	}

	async loadPage(page) {
		await fetch(page)
			.then(response => response.text())
			.then(html => {
				this.htmlContent = html;
			})
			.catch(error => {
				console.error('Error loading page:', error);
			});
	}

	withNavigation (elementId) {
		this.navigations.push(elementId);
		return this;
	}

	withListener(elementId, listenerType, targetFunction) {
		this.listeners.push([elementId, listenerType, targetFunction]);
		return this;
	}

	async build() {
		await this.loadPage( htmlFolderPath + this.htmlFileName);
	}
}