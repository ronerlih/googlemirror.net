const express = require("express"),
	request = require("request").defaults({jar: true}),
	fs = require("fs"),
	axios = require("axios");
const https = require("https");
const getImageUrl = require("./getImageUrl")

function getHttps(url) {
	return new Promise((resolve, reject) => {
		https
			.get(url, (res) => {
				if (res.headers.location) {
					console.log("\n\n\n\nREDIRECT to:");
					console.log(res.headers.location);
					if (res.headers.location.indexOf("https://www.google.com/search") >= 0) return getHttps(res.headers.location);
				}

				// console.log("statusCode:", res.statusCode);
				// console.log("headers:", res.headers);

				let data = "";
				res.on("data", (d) => {
					data += d;
				});

				res.on("end", () => {
					process.stdout.write(data);
					resolve(data);
				});
			})
			.on("error", (e) => {
				console.error(e);
			});
	});
}

const log4js = require("log4js");
log4js.configure({
	appenders: { googlemirror: { type: "stdout" } },
	categories: { default: { appenders: ["googlemirror"], level: "info" } },
});
const logger = log4js.getLogger("googlemirror");

// twiter = require('./twiter');
const FormData = require("form-data");

const app = express();

app.configure(function () {
	app.use(
		express.bodyParser({
			uploadDir: "./public/img",
			keepExtensions: true,
		})
	);
	app.use(express.methodOverride());
	app.use(express.cookieParser());
	// app.use(express.session({ secret: "batman" }));
	// app.use(app.router);

	app.use(express.static(__dirname + "/public"));
});
app.get("/", function (req, res) {
	console.log("/  called ########################");

	fs.readFile(__dirname + "/public/index.htm", "utf8", function (err, text) {
		if (err) res.send("oops");
		res.send(text);
	});
});

var lastGglImgs = [];

app.post("/upload", async function (req, res) {
	console.log("\n\n📷 new img upload!!");

	if (!req.files.img) res.send("error, no img recieved");

	var filenameIdx = req.files.img.path.lastIndexOf("/");
	var tmpName = req.files.img.path.substring(filenameIdx + 1);

	var urlParmas =
		"?image_url=https://mirror-snapshot-service.herokuapp.com/img/" +
		tmpName +
		"&btnG=Search+by+image&encoded_image=&image_content=&filename=&hl=en";
	// "?image_url=https://" + req.host + ":8080/img/" + tmpName + "&btnG=Search+by+image&encoded_image=&image_content=&filename=&hl=en";
          

      let links = await getImageUrl("https://www.google.com/searchbyimage" + urlParmas);
      
      // send random img
      res.end(links[Math.floor(Math.random() * links.length)]);
		}
	);

function guessGglImg(res) {
	console.log("imgsRslt.length = " + lastGglImgs.length);
	if (lastGglImgs.length <= 1) {
		console.log("not found");
		return;
	}
	var num = parseInt(Math.random() * (lastGglImgs.length - 1 + 1));
	var str;
	if (lastGglImgs.length > num) str = lastGglImgs[num];
	else str = lastGglImgs[0];

	var pos = str.lastIndexOf(".j");
	pos = str.indexOf("%", pos);
	if (pos != -1) str = str.substring(0, pos);

	lastImg = str;
	//res(lastImg);
}

var lastImg = "";
app.get("/lastSearchedImage", function (req, res) {
	guessGglImg();
	console.log("///////////////lastSearchedImage");
	//res.json("<h1>hello word</h1>");

	res.set("Content-Type", "text/plain");
	lastImg = lastImg || "";
	res.send(lastImg.replace('"', ""));
});

var nvsio = {
	id: "be005eb1",
	secert: "f948f61584ddb50342b50e7f846324db",
};

var lastImgEmotion = "";

var lastImgEmotionOBJ = null;

app.get("/getImgEmotionStr", function (req, res) {
	if (!lastImgEmotionOBJ) {
		res.send("");
		return;
	}

	var result = "";
	var emo = lastImgEmotionOBJ;

	for (var key in emo) {
		if (parseFloat(emo[key]) > 0.01) result += "," + key + "," + parseInt((emo[key] * 100 * 255) / 100);
	}

	res.send(result.substring(1));
});
var lastImgEmotionDots = "";
app.get("/getImgEmotioDots", function (req, res) {
	console.log("### $$$$  getImgEmotioDots  value = " + lastImgEmotionDots);

	res.set("Content-Type", "text/plain");
	lastImgEmotionDots = lastImgEmotionDots || "empty";
	res.send(lastImgEmotionDots);
});

app.get("/getImgEmotionUrl", function (req, res) {
	console.log("### $$$$  getImgEmotionUrl  value = " + lastImgEmotion);
	res.set("Content-Type", "text/plain");
	lastImgEmotion = lastImgEmotion || "neutral";
	res.send(lastImgEmotion);
});

app.post("/uploadImgEmotion", function (req, res) {
	console.log("/uploadImgEmotion [return random nvisio is down]");
	//return random always !!!
	hndlEmoError(res);
	//return;

	var indx = req.files.img.path.lastIndexOf("/");
	var tmpName = req.files.img.path.substring(indx + 1);

	var imgUrl = "http://" + req.host + "/img/" + tmpName;
	console.log("imgUrl = " + imgUrl);

	imgUrl = encodeURIComponent(imgUrl);

	var url = "https://3dfi.nviso.net/api/v1/process/url?app_id=" + nvsio.id + "&app_key=" + nvsio.secert + "&url=" + imgUrl;

	console.log("url = " + url);
	/*

  */

	request.get(url, function (err, rslt) {
		console.log("nvisio api resposene ");
		if (err) {
			console.log("err =>" + err);
			console.dir(err);
			hndlEmoError(res);
			return;
		}

		var obj = JSON.parse(rslt.body);
		if (obj.status.code != "success") {
			hndlEmoError(res);
			return;
		}
		var str = JSON.stringify(obj.images[0].faces[0].attribute.emotion);
		lastImgEmotion = str.replace(/{|}|"/g, "");

		res.json(lastImgEmotion);

		var faces = obj.images[0].faces;
		for (var j = 0; j < faces.length; j++) {
			for (var key in faces[j]) {
				if (key != "attribute") lastImgEmotionDots += JSON.stringify(faces[j][key]);
			}
		}

		lastImgEmotionDots = lastImgEmotionDots.replace(/{|}|"/g, "");

		//console.log(lastImgEmotionDots);
		fs.unlink(imgUrl, function () {});
	});
});
app.post("/uploadImgEmotion.old", function (req, res) {
	console.log("/uploadImgEmotion");

	var indx = req.files.img.path.lastIndexOf("/");
	var tmpName = req.files.img.path.substring(indx + 1);

	var imgUrl = "http://" + req.host + "/img/" + tmpName;
	console.log("imgUrl = " + imgUrl);

	imgUrl = encodeURIComponent(imgUrl);

	var url = "https://3dfi.nviso.net/api/v1/process/url?app_id=" + nvsio.id + "&app_key=" + nvsio.secert + "&url=" + imgUrl;

	console.log("url = " + url);
	/*

  */

	request.get(url, function (err, rslt) {
		console.log("nvisio api resposene");
		if (err) {
			res.json(err.message);
			return;
		}

		var obj = JSON.parse(rslt.body);
		if (obj.status.code != "success") {
			res.json(obj.status.code);
			return;
		}
		var rsltStr = [];
		for (var i = 0; i < obj.images.length; i++) {
			var emo = obj.images[0].faces[0].attribute.emotion;
			lastImgEmotionOBJ = emo;
			if (emo) {
				for (var key in emo) {
					console.log("key =" + key + " val = " + parseFloat(emo[key]));
					if (parseFloat(emo[key]) > 0.01) rsltStr.push(key);
				}
			}
		}
		rsltStr.sort(function (a, b) {
			return parseFloat(emo[a]) < parseFloat(emo[b]);
		});

		res.json(rsltStr);
		lastImgEmotion = rsltStr.join("\n");
	});
});

app.get("/searchtwit", function (req, res) {
	console.log("searchtwit");

	var q = req.query["q"];
	if (!q) {
		res.send("use q=happy");
		return;
	}

	twiter.searchTwit(q, function (rslt) {
		console.log("searchtwit 33");
		if (rslt == "") {
			res.send("");
			return;
		}

		//console.dir(rslt);
		var obj = rslt;

		var twits = [];
		obj = obj.statuses;
		console.log("searchtwit 44");
		for (var i = 0; i < obj.length; i++) {
			twits.push(obj[i].text);
		}

		console.log(twits.length);
		res.send(twits[parseInt((Math.random() * 100) % twits.length)]);
	});
});

process.on("uncaughtException", function (err) {
	console.log("Caught exception: " + err);
});

function hndlEmoError(resp) {
	var arr = ["neutral", "sadness", "disgust", "anger", "surprise", "fear", "happiness"];
	arr = shuffleArr(arr);
	var res = {};
	var sum = 100;
	for (var i = 0; i < arr.length; i++) {
		var it = getRandomArbitrary(0, sum);
		sum = sum - it;
		res[arr[i]] = it / 100;
	}
	console.log("hndlEmoError fake emotion");

	var fakeRes =
		"neutral:" +
		res["neutral"] +
		",sadness:" +
		res["sadness"] +
		",disgust:" +
		res["disgust"] +
		",anger:" +
		res["anger"] +
		",surprise:" +
		res["surprise"] +
		",fear:" +
		res["fear"] +
		",happiness:" +
		res["happiness"];

	console.log("fakeRes =>" + fakeRes);
	lastImgEmotion = fakeRes;
	resp.send(fakeRes);
}
function getRandomArbitrary(min, max) {
	return parseInt(Math.random() * (max - min) + min);
}

function shuffleArr(arr) {
	var i = arr.length;
	while (--i) {
		var j = Math.floor(Math.random() * (i + 1));
		var temp = arr[i];
		arr[i] = arr[j];
		arr[j] = temp;
	}

	return arr; // for convenience, in case we want a reference to the array
}

var youtubeTitle;

app.get("/setYoutubeTitle/:title", function (req, res) {
	var title = req.params.title;
	if (title) {
		youtubeTitle = title;
	}
	res.send(title);
	return;
});

app.get("/getYoutubeTitle", function (req, res) {
	res.send(youtubeTitle || "not avialable");
});

var pool = [];

app.get("/set/:key/:val", function (req, res) {
	var key = req.params.key;
	var val = req.params.val;
	if (key && val) {
		pool.key = val;
		res.send("ok");
		return;
	}
	res.send("not ok");
});

app.get("/get/:key", function (req, res) {
	var key = req.params.key;
	if (!key) {
		res.send("");
		return;
	}
	if (pool.key) {
		res.send(pool.key);
		return;
	}
	res.send("");
});

var ip = process.env.IP || "0.0.0.0";
var port = process.env.PORT || "8080";

app.listen(port, ip);

console.log("Wellcome Fetch image server Port:%d, IP:%d", port, ip);
