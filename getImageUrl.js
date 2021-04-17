const puppeteer = require("puppeteer");

module.exports = async function getImageUrl(url) {
	const browser = await puppeteer.launch({ args: ["--no-sandbox"] });
	const page = await browser.newPage();
	await page.goto(url);

	// get cookies from rist call
	const cookies = await page.cookies();

	// screen shot
	// await page.screenshot({ path: "images-screenshot.png", fullPage: true });

	// Extract the results from the page.
	const resultsSelector = 'a[href^="/search?sa=G&hl=en&tbs=simg"]';
	const links = await evaluateSelector(resultsSelector, "href");

	// set cookies from first call
	await page.setCookie(...cookies);
	await page.goto(links[0], { waitUntil: "networkidle0" });

	const gridResultsSelector = 'div[jsdata*="GRID_STATE"] a';

	// get thumbLink
	let thumbLinks = await page.$$(gridResultsSelector);

	thumbLinks = await thumbLinks.filter(async (anchor, i) => {
		const jsVal = await anchor.jsonValue();
		return jsVal.__jsaction ? true : false;
	});

	console.log({ thumbLinks });
	let imagesLinks = [];
	// generate click
	await Promise.all(thumbLinks.map(async (link) => {
		await evaluateClick(link);
		const imgResultsSelector = 'a[href*="imgres"]';
		const imgLinks = await evaluateSelector(imgResultsSelector, "href");
      // imgLinks.map(link => new URLSearchParams(link.toString()));
		imagesLinks = imagesLinks.concat(imgLinks);
	}));

	console.log({ imagesLinks });
	// screen shot
	// await page.screenshot({ path: "images-screenshot.png", fullPage: true });

	page.close();
	// return urlParams.get("https://www.google.com/imgres?imgurl")
	return imagesLinks;

	async function evaluateClick(link) {
		var arg = link;
		return await page.evaluate((arg) => {
			arg.click();
		}, arg);
	}
	async function evaluateSelector(selector, tag) {
		var args = [selector, tag];

		return await page.evaluate((args) => {
			const anchors = Array.from(document.querySelectorAll(args[0]));
			return anchors.map((anchor) => {
				// const title = anchor.textContent.split("|")[0].trim();
				return `${anchor[args[1]]}`;
			});
		}, args);
	}
};
