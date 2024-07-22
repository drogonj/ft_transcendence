import {navigateTo} from "./contentLoader.js";

export const pages = new Map;
export const htmlFolderPath = "./"

export default class Page {
	constructor(htmlFileName) {
		this.htmlFileName = htmlFileName;
		this.htmlContent = "";
		this.navigations = [];
		this.listeners = [];
		pages.set(htmlFileName, this);
	}

	render() {
		document.body.innerHTML = this.htmlContent;
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

	/**
	 * Adds a navigation element to the page.
	 *
	 * Works only with HTML elements that can define a href attribute.
	 * The href value will be the target page where to navigate.
	 *
	 * @param {string} elementId - The id of the HTML element
	 * @returns {Page} The current Page object.
	 */

	withNavigation (elementId) {
		this.navigations.push(elementId);
		return this;
	}

	/**
	 * Adds a listener event to the page.
	 *
	 * @param {string} elementId - The ID of the HTML element.
	 * @param {string} listenerType - The type of listener (such as "click", "mouseover" ...).
	 * @param {Function} targetFunction - The reference to the function to be triggered.
	 * @returns {Page} The current Page object.
	 */

	withListener(elementId, listenerType, targetFunction) {
		this.listeners.push([elementId, listenerType, targetFunction]);
		return this;
	}

	async build() {
		await this.loadPage( htmlFolderPath + this.htmlFileName);
	}
}

/**
 * Returns the reference of the render function of the target page
 *
 * This function is used for purposes such as event listeners or other event handlers.
 *
 * @param {string} targetHtmlFile - The target html file
 * @returns {Function} The reference to the render function of the target page.
 */

export function getRenderFuncRef(targetHtmlFile) {
		const page = getPage(targetHtmlFile);
		return page.render.bind(page);
}

export function getPage(targetHtmlFile) {
		return pages.get(targetHtmlFile);
}

export function renderPageWithName(pageName) {
	getPage(pageName).render();
}