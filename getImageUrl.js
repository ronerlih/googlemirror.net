const puppeteer = require("puppeteer");

module.exports = async function getImageUrl(url) {
   let resourcesLinks = [];
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
	resourcesLinks = await evaluateSelector(gridResultsSelector, "click")

   console.log("resources links after evaluate:", resourcesLinks)
	// const imgResultsSelector = 'a[href*="imgres"]';

	// const imgLink = await evaluateSelector(imgResultsSelector, "href")

   // screen shot
	// await page.screenshot({ path: "images-screenshot.png", fullPage: true });

   resourcesLinks = resourcesLinks.map (link => new URLSearchParams(link.toString()).get("https://www.google.com/imgres?imgurl"))
   page.close();
   return resourcesLinks
	

	async function evaluateSelector(selector, tag) {
      const linksArray = [];
      var args = [selector, tag];

		return await page.evaluate((args) => {
			const anchors = Array.from(document.querySelectorAll(args[0]));
			if (args[1] === "click") {

				anchors
               .filter(anchor =>  anchor.__jsaction )
               .map(async (anchor) => {

               anchor.click();
               const imgResultsSelector = 'a[href*="imgres"]';
               
               console.log({args})
               const links = await evaluateSelector(imgResultsSelector, "href");
               console.log("\n\n\n\n\n\n 🇨🇦 evaluate selector (links):", links)
	            linksArray.push(links);
            
            return linksArray;

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
