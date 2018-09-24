//Dependencies
const express = require("express");
const bodyParser = require("body-parser");
const logger = require("morgan");
const mongoose = require("mongoose");

//Initialize Express]
const app = express();


//Setup for express handlebars for templating
const exphbs = require("express-handlebars");
app.engine("handlebars", exphbs({ defaultLayout: "main" }));
app.set("view engine", "handlebars");

//port set up for Heroku deployment
var PORT = process.env.MONGO_URI || 3000;

// Database configuration with mongoose
if (process.env.MONGO_URI) {
    mongoose.connect("mongodb://heroku_vld9mb7l:L3zEat!!@ds111993.mlab.com:11993/heroku_vld9mb7l");
    const db = mongoose.connection;

    // For mongoose errors
    db.on("error", function (error) {
        console.log("Mongoose Error: ", error);
    });
};

// Once logged in to the db through mongoLab
// db.onConnect("open", function() {
//     console.log("Mongoose connection successful.");
//   });


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

// Get route for scraping the Formula 1 website
app.get("/scrape", function (req, res) {
    // First, we grab the body of the html with request
    axios.get("https://www.thrillist.com/eat/nation/best-burgers-in-america-burger-quest#").then(function (response) {
        // Then, we load that into cheerio and save it to $ for a shorthand selector
        var $ = cheerio.load(response.data);

        // Now, we grab every h2 within an article tag, and do the following:
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
            // db.Article.create(result)
            //   .then(function(dbArticle) {
            //     // View the added result in the console
            //     console.log(dbArticle);
            //   });
            //   .catch(function(err) {
            //     // If an error occurred, send it to the client
            //     return res.json(err);
            //   });
            console.log(result);
        });

        // If we were able to successfully scrape and save an Article, send a message to the client
        res.send("Scrape Complete");
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


// Start the server
app.listen(PORT, function () {
    console.log("App running on port " + PORT + "!");
});
