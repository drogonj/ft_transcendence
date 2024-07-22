export function displayStatistics(statisticsLeft, statisticsRight) {
	createDivs(statisticsLeft.getAllStatisticsAsArray(), document.getElementById("leftPlayer"));
	createDivs(statisticsRight.getAllStatisticsAsArray(), document.getElementById("rightPlayer"));

}

function createDivs(stats, htmlElement) {
	stats.forEach((stat) => {
		const div = document.createElement("div");
		div.textContent = stat;
		htmlElement.appendChild(div);
	})
}