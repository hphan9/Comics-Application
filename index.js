//require and configure dotenv
const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const cors = require("cors");
var path = require("path");
const fetch = require("node-fetch");
const exphbs = require("express-handlebars");
const { pathToFileURL } = require("url");
//set HTTP_PORT
const HTTP_PORT = process.env.PORT || 8080;
// Add support for incoming JSON entities
// body-parser extracts the entire body portion of an incoming request stream and exposes it on req.body as something easier to interface with.
app.use(bodyParser.json());
// Add support for CORS
app.use(cors());
//server needs to know how to handle HTML files that are formatted using handlebars
app.engine("hbs", exphbs({ extname: "hbs" }));
app.set("view engine", "hbs");

function onHttpStart() {
  console.log("Express http server listening on: " + HTTP_PORT);
}

// make new comic format
const createComic = function (resJson) {
  let date = new Date(resJson.year + " " + resJson.month + " " + resJson.day);
  let comic = {
    img: resJson.img,
    title: resJson.title,
    date: date.toDateString(),
    num: resJson.num,
    alt: resJson.alt,
  };
  return comic;
};
// the max of the page.
let MaxNum = 2000;

app.use(express.static(path.join(__dirname, "public")));
//GET / route
app.get("/", (req, res) => {
  fetch(`http://xkcd.com/info.0.json`)
    .then(function (resObj) {
      return resObj.json();
    })
    .then(function (resJson) {
      let comic = createComic(resJson);
      res.render("general/comic", {
        comic: comic,
      });
      //the current comic has highest num in the comic list
      MaxNum = comic.num;
    })
    .catch((err) => {
      console.log(err);
      res.render("general/comic");
    });
});
//Get /random route
app.get("/random", (req, res) => {
  //get random Number
  let randomNo = Math.floor(Math.random() * MaxNum);
  res.redirect(`/${randomNo}`);
});
//get /next/:id route:
app.get("/next/:id", (req, res) => {
  let index = parseInt(req.params.id) + 1;
  //if index is bigger than MaxNum -> make it equal to 0
  if (index > MaxNum) index = MaxNum;
  res.redirect(`/${index}`);
});
// get /prev/:id route:
app.get("/prev/:id", (req, res) => {
  let index = parseInt(req.params.id) - 1;
  if (index < 1) index = 1;
  res.redirect(`/${index}`);
});
//Get /:id route
app.get("/:id", (req, res) => {
  let index = parseInt(req.params.id);
  fetch(`http://xkcd.com/${index}/info.0.json`)
    .then((res) => res.json())
    .then((resJson) => {
      let comic = createComic(resJson);
      res.render("general/comic", {
        comic: comic,
      });
    })
    .catch((err) => {
      console.log(err);
      res.render("general/comic");
    });
});
// send back 404 if the routes is not in the list or requests to pages that are not found.
app.use((req, res) => {
  res.status(404).send("Page Not Found");
});
//setup http server to listen on HTTP_PORT
app.listen(HTTP_PORT, onHttpStart);
