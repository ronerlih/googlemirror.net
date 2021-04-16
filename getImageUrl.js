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
	await evaluateSelector(gridResultsSelector, "click",resourcesLinks)

	// const imgResultsSelector = 'a[href*="imgres"]';

	// const imgLink = await evaluateSelector(imgResultsSelector, "href")

   // screen shot
	// await page.screenshot({ path: "images-screenshot.png", fullPage: true });

   resourcesLinks.map (link => new URLSearchParams(link.toString()).get("https://www.google.com/imgres?imgurl"))
   page.close();
   return resourcesLinks
	

	async function evaluateSelector(selector, tag, linksArray) {
      var args = [selector, tag, linksArray];

		return await page.evaluate((args) => {
			const anchors = Array.from(document.querySelectorAll(args[0]));
			if (args[1] === "click") {

				return anchors
               .filter(anchor =>  anchor.__jsaction )
               .map(async (anchor) => {

               anchor.click();
               const imgResultsSelector = 'a[href*="imgres"]';
               
               console.log(args)
               const links = await evaluateSelector(imgResultsSelector, "href");
	            args[2].push(links);


            })
			} else {

				return anchors.map((anchor) => {
					const title = anchor.textContent.split("|")[0].trim();
					return `${anchor[args[1]]}`;
				});
			}
		}, args);
	}
}
