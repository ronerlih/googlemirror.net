const puppeteer = require("puppeteer");

module.exports = async function getImageUrl(url) {
	const browser = await puppeteer.launch();
	const page = await browser.newPage();
	await page.goto(url);

	// get cookies from rist call
	const cookies = await page.cookies();


	// Extract the results from the page.
	const resultsSelector = 'a[href^="/search?sa=G&hl=en&tbs=simg"]';
	const links = await evaluateSelector(resultsSelector, "href");

	// set cookies from first call
	await page.setCookie(...cookies);
console.log(links)
	await page.goto(links[0], { waitUntil: "networkidle0" });

	const gridResultsSelector = 'div[jsdata*="GRID_STATE"] a';

   // generate click
	evaluateSelector(gridResultsSelector, "click")

	const imgResultsSelector = 'a[href*="imgres"]';

	const imgLink = await evaluateSelector(imgResultsSelector, "href")

   // screen shot
	// await page.screenshot({ path: "images-screenshot.png", fullPage: true });

	const urlParams = new URLSearchParams(imgLink.toString());
   page.close();
   return urlParams.get("https://www.google.com/imgres?imgurl")
	

	async function evaluateSelector(selector, tag) {
      var args = [selector, tag];

		return await page.evaluate((args) => {
			const anchors = Array.from(document.querySelectorAll(args[0]));
			if (args[1] === "click") {
            let clicked = false;

            for (let anchor of anchors)
               if (anchor.__jsaction && !clicked) {
                  anchor.click();
                  clicked = true;
                  return;
               }
			} else {

				return anchors.map((anchor) => {
					const title = anchor.textContent.split("|")[0].trim();
					return `${anchor[args[1]]}`;
				});
			}
		}, args);
	}
}
