const puppeteer = require("puppeteer");

module.exports = async function getImageUrl(url) {
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

   // get thumbLink
   thunbLinks = await page.$$(gridResultsSelector)
   console.log('bfr filter:',{thunbLinks})

   thunbLinks = thunbLinks.filter(anchor => anchor.__jsaction)

   console.log({thunbLinks})
   const imagesLinks = [];
   // generate click
	thunbLinks.map ( async link => {
      await evaluateClick(link);
      const imgResultsSelector = 'a[href*="imgres"]';
      const imgLinks = await evaluateSelector(imgResultsSelector, "href")
      console.log({imgLinks})
      imagesLinks = imagesLinks.concat(imgLinks)
   })

	console.log({imagesLinks})
   // screen shot
	// await page.screenshot({ path: "images-screenshot.png", fullPage: true });

	// const urlParams = new URLSearchParams(imgLink.toString());
   // page.close();
   // return urlParams.get("https://www.google.com/imgres?imgurl")
	return ["https://gravatar.com/avatar/4977c2c87b44a2ccec8e02dc7c1cf643?s=96&d=https://www.herokucdn.com/images/ninja-avatar-96x96.png"]


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
					const title = anchor.textContent.split("|")[0].trim();
					return `${anchor[args[1]]}`;
				});
		}, args);
	}
}
