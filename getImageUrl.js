const puppeteer = require("puppeteer");

module.exports = async function getImageUrl(url) {
   const resourcesLinks = [];
	const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
	const page = await browser.newPage();
	await page.goto(url);

	// get cookies from rist call
	const cookies = await page.cookies();

   // screen shot
	await page.screenshot({ path: "images-screenshot.png", fullPage: true });


	// Extract the results from the page.
	const resultsSelector = 'a[href^="/search?sa=G&hl=en&tbs=simg"]';
	const links = await evaluateSelector(resultsSelector, "href");

	// set cookies from first call
	await page.setCookie(...cookies);
   console.log({links})
	await page.goto(links[0], { waitUntil: "networkidle0" });

	const gridResultsSelector = 'div[jsdata*="GRID_STATE"] a';

   // generate click
	evaluateSelector(gridResultsSelector, "click",resourcesLinks)

	// const imgResultsSelector = 'a[href*="imgres"]';

	// const imgLink = await evaluateSelector(imgResultsSelector, "href")

   // screen shot
	// await page.screenshot({ path: "images-screenshot.png", fullPage: true });

   resourcesLinks.map (link => new URLSearchParams(link.toString()).get("https://www.google.com/imgres?imgurl"))
   page.close();
   return resourcesLinks
	

	async function evaluateSelector(selector, tag, linksArray) {
      var argu = [selector, tag, linksArray];

		return await page.evaluate((args) => {
			const anchors = Array.from(document.querySelectorAll(args[0]));
			if (argu[1] === "click") {

				return anchors
               .filter(anchor =>  anchor.__jsaction )
               .map((anchor) => {

               anchor.click();
               const imgResultsSelector = 'a[href*="imgres"]';

	            argu[2].push(await evaluateSelector(imgResultsSelector, "href"));


            })
			} else {

				return anchors.map((anchor) => {
					const title = anchor.textContent.split("|")[0].trim();
					return `${anchor[argu[1]]}`;
				});
			}
		}, argu);
	}
}
