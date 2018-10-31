//Dependencies
const express = require("express");
const bodyParser = require("body-parser");
const logger = require("morgan");
const mongoose = require("mongoose");
var path = require("path");
require('dotenv').config();


//Initialize Express]
const app = express();


//Setup for express handlebars for templating
const exphbs = require("express-handlebars");
app.engine("handlebars", exphbs({ defaultLayout: "main", 
partialsDir: path.join(__dirname, "/views/layouts/partials") 
}));
app.set("view engine", "handlebars");

//port set up for Heroku deployment
var PORT = process.env.PORT || 3000;

// If deployed, use the deployed database. Otherwise use the local mongoHeadlines database
var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/mongoHeadlines"
mongoose.Promise = Promise;
mongoose.connect(MONGODB_URI);




//Scraping tools
const axios = require("axios");
const cheerio = require("cheerio");

//require all models
var db = require("./models");

//configure middleware
//To log requests
app.use(logger("dev"));
//body-parser for handling form submissions
app.use(bodyParser.urlencoded({ extended: true }));
//express.static to serve the public folder as a static directory
app.use(express.static("public"));

// The routes
app.get("/", function(req, res) {
    db.Article.find({"saved": false}, function(error, data) {
        if (error) {
            next(error); // Pass errors to Express.
          } else {
        var hbsObject = {
            article: data
        }};
       
        console.log(hbsObject);
        res.render("index", hbsObject)
    });
});

app.get("/saved", function(req, res) {
    db.Article.find({"saved": true}).exec(function(error, articles) {
        var hbsObject = {
            article: articles
        };
        res.render("saved", hbsObject);
    });
});

// Get route for scraping the Formula 1 website
app.get("/scrape", function (req, res) {
    // To grab the body of the html with request
    axios.get("https://www.thrillist.com/eat/nation/best-burgers-in-america-burger-quest#").then(function (response) {
        // Then, we load that into cheerio and save it to $ for a shorthand selector
        var $ = cheerio.load(response.data);

        
        // To grab every various elements within a section tag
        $("section.save-venue").each(function (i, element) {
            // Save an empty result object
            var result = {};
                
            // Add the text and href of every link, and save them as properties of the result object
            result.title = $(element)
                .children("hgroup.save-venue__header")
                .text();
            result.link = $(element)
                .children("hgroup.save-venue__sub-header").children("a")
                .attr("href");
            result.summary = $(element)
                .children("p")
                .text()


            //Create a new Article using the `result` object built from scraping
            db.Article.create(result)
              .then(function(dbArticle) {
                console.log(dbArticle);
              })
              
              .catch(function(err) {
                // console.log(dbArticle);
                // If an error occurred, send it to the client
                return res.json(err);
              });
            
            
        });

        // If we were able to successfully scrape and save an Article, send a message to the client
        res.send("Scrape Complete");
    });
});

// Save an article
app.post("/articles/save/:id", function(req, res) {
    // Use the article id to find and update its saved boolean
    db.Article.findOneAndUpdate({ "_id": req.params.id }, { "saved": true})
    // Execute the above query
    .exec(function(err, doc) {
      // Log any errors
      if (err) {
        console.log(err);
      }
      else {
        // Or send the document to the browser
        res.send(doc);
        console.log(doc);
      }
    });
});

// Route for getting all Articles from the db
app.get("/articles", function (req, res) {
    // Grab every document in the Articles collection
    db.Article.find({})
        .then(function (dbArticle) {
            // If we were able to successfully find Articles, send them back to the client
            res.json(dbArticle);
            console.log(dbArticle);
        })
        .catch(function (err) {
            // If an error occurred, send it to the client
            res.json(err);
        });
});

// Route for grabbing a specific Article by id, populate it with it's note
app.get("/articles/:id", function(req, res) {
    // Using the id passed in the id parameter, prepare a query that finds the matching one in our db...
    db.Article.findOne({ _id: req.params.id })
      // ..and populate all of the notes associated with it
      .populate("note")
      .then(function(dbArticle) {
        // If we were able to successfully find an Article with the given id, send it back to the client
        res.json(dbArticle);
      })
      .catch(function(err) {
        // If an error occurred, send it to the client
        res.json(err);
      });
  });
  
  // Route for saving/updating an Article's associated Note
  app.post("/articles/:id", function(req, res) {
    // Create a new note and pass the req.body to the entry
    db.Note.create(req.body)
      .then(function(dbNote) {
        // If a Note was created successfully, find one Article with an `_id` equal to `req.params.id`. Update the Article to be associated with the new Note
        // { new: true } tells the query that we want it to return the updated User -- it returns the original by default
        // Since our mongoose query returns a promise, we can chain another `.then` which receives the result of the query
        return db.Article.findOneAndUpdate({ _id: req.params.id }, { note: dbNote._id }, { new: true });
      })
      .then(function(dbArticle) {
        // If we were able to successfully update an Article, send it back to the client
        res.json(dbArticle);
      })
      .catch(function(err) {
        // If an error occurred, send it to the client
        res.json(err);
      });
  });
  


// Start the server
app.listen(PORT, function () {
    console.log("App running on port " + PORT + "!");
});
