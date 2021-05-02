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

   console.log({links})
	// set cookies from first call
	await page.setCookie(...cookies);
	await page.goto(links[0], { waitUntil: "networkidle0" });

   // try {

   //    // match images grid container
   //    var xpath = "//h3[contains(., 'Visually similar images')]";
   //    var matchingElement = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
   //    console.log(matchingElement)
   // } catch (e) {
   //    console.log(e)
   // }


	// const gridResultsSelector = 'div[jsdata*="GRID_STATE"] a';

	// // get thumbLink
	// let thumbLinks = await page.$$(gridResultsSelector);
   let imgLinks = await page.evaluate(async () => {
      const imgResultsSelector = 'a[href*="imgres"]';
      return document.querySelectorAll(imgResultsSelector)
         .map(el => el.href);
   });

	// thumbLinks = await thumbLinks.filter(async (anchor, i) => {
	// 	const jsVal = await anchor.jsonValue();
	// 	return jsVal.__jsaction ? true : false;
	// }).slice(0,10);

	// console.log({ thumbLinks });
	let imagesLinks = [];
	// generate click
	imgLinks.map(async (link) => {
		await evaluateClick(link);
		// const imgResultsSelector = 'a[href*="imgres"]';
		let imgLinks = await evaluateSelector(imgResultsSelector, "href");
      imgLinks = imgLinks.map( link =>  {
         // console.log({imgLinks})
         const urlParams = new URLSearchParams(link.toString())
	      return urlParams.get("https://www.google.com/imgres?imgurl")
      });
		imagesLinks = imagesLinks.concat(imgLinks);
	}));

	console.log({ imagesLinks });
	// screen shot
	// await page.screenshot({ path: "images-screenshot.png", fullPage: true });

	page.close();
	return imagesLinks;

	async function evaluateClick(link) {
		var arg = link;
		 await page.evaluate((arg) => {
			arg.click();
		}, arg);
      return;
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
