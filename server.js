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
app.use(bodyParser.urlencoded({extended:false}));
// Add support for CORS
app.use(cors());
//server needs to know how to handle HTML files that are formatted using handlebars
app.engine("hbs", exphbs({ extname: "hbs" }));
app.set("view engine", "hbs");
//database
const MONGODB_CONN_STRING= "mongodb+srv://hphan9:*Mochibeo1091@cluster0.uo1jj.mongodb.net/comicView?retryWrites=true&w=majority";

// Import data
const ComicDb = require("./modules/comicDB");
const db = new ComicDb(MONGODB_CONN_STRING);

function onHttpStart() {
  console.log("Express http server listening on: " + HTTP_PORT);
}


// Map object to store the data of how many times a comic is view
let viewedList= new Map();
// the default max of the page.
let MaxNum = 2400;
// make new comic format
const createComic = function (resJson) {
  //create date
  let date = new Date(resJson.year + " " + resJson.month + " " + resJson.day);
  // make transcript to be more readable
  let temp= resJson.transcript;
  temp = temp.replace(/[\[\]\{\} \( \)]/g,' ');
  let comic = {
    img: resJson.img,
    title: resJson.title,
    date: date.toDateString(),
    num: parseInt(resJson.num),
    alt: resJson.alt,
    transcript:temp,
    view: 0
  };
  return comic;
};


app.use(express.static(path.join(__dirname, "public")));
//GET / route
app.get("/", (req, res) => {
  fetch(`http://xkcd.com/info.0.json`)
    .then(function (resObj) {
      return resObj.json();
    })
    .then( resJson =>{
     let comic= createComic(resJson);
     return db.getViewByNum(comic.num)
     .then(result=>{
      if(result=== null){
      comic.view= 1;
      db.addNewView(comic.num, comic.view);
      }else{
      comic.view= result.view +1;
      db.updateComicByNum(comic.view, comic.num)
      } 
      return Promise.resolve(comic);
    }).catch(err=>Promise.reject(err))

    })
    .then(comic => {res.render("general/comic", {
      comic: comic,
    });
    }
    )
    .catch(err=>{
      console.log(err);
      res.render("general/comic")
      });
});
//Get /random route
app.get("/random", (req, res) => {
  //get random Number
  let randomNo = Math.floor(Math.random() * MaxNum + 1);
  res.redirect(`/getId/${randomNo}`);
});
//get /next/:id route:
app.get("/next/:id", (req, res) => {
  let index = parseInt(req.params.id) + 1;
  //if index is bigger than MaxNum -> make it equal to 0
  if (index > MaxNum) index = MaxNum;
  res.redirect(`/getId/${index}`);
});
// get /prev/:id route:
app.get("/prev/:id", (req, res) => {
  let index = parseInt(req.params.id) - 1;
  if (index < 1) index = 1;
  res.redirect(`/getId/${index}`);
});
//search for index
app.post("/searchIndex", (req,res)=>{
let index= req.body.index;
res.redirect(`/getId/${index}`);
});
//Get /:id route
app.get("/getId/:id", (req, res) => {
  let index = parseInt(req.params.id);
  fetch(`http://xkcd.com/${index}/info.0.json`)
    .then((res) => res.json())
    .then( resJson =>{
      let comic= createComic(resJson);
      return db.getViewByNum(comic.num)
      .then(result=>{
       if(result=== null){
       comic.view= 1;
       db.addNewView(comic.num, comic.view);
       }else{
       comic.view= result.view +1;
       db.updateComicByNum(comic.view, comic.num)
       } 
       return Promise.resolve(comic);
     }).catch(err=>Promise.reject(err))
 
     })
     .then(comic => {res.render("general/comic", {
       comic: comic,
     });
     }
     )
     .catch(err=>{
       console.log(err);
       res.render("general/comic")
       });
});
// send back 404 if the routes is not in the list or requests to pages that are not found.
app.use((req, res) => {
  res.status(404).send("Page Not Found");
});



//if the server starts successfully, then run hte code in the function onHttpStart
db.initialize()
  .then(() => {
    app.listen(HTTP_PORT, () => {
      console.log(`server listening on ${HTTP_PORT}`);
    });
  })
  .catch((err) => {
    console.log("THERE ARE AN ERROR " + err);
  });
