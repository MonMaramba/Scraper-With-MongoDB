const mongoose = require("mongoose");

//reference to the schema constructor
const Schema = mongoose.Schema;

//Creating the UserSchema object

const ArticleSchema = new Schema({
    title: {
        type: String,
        required: `A title is necessary`
    },
    link: {
        type: String,
        required: `A link is required`
    },
    summary: {
        type: String
    },
    note: {
        type: Schema.Types.ObjectId,
        ref: "Note"
    }

});

//To create the model from the schema
const Article = mongoose.model("Article", ArticleSchema);

//To export the Article model
module.exports = Article;