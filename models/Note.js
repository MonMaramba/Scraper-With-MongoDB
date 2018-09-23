const mongoose = require("mongoose");

//reference to the schema constructor
const Schema = mongoose.Schema;

//Creating the NoteSchema object
const NoteSchema = new Schema({
    title: String,
    body: String
});

//To create the model based on the schema above

const Note = mongoose.model("Note", NoteSchema);

//To export the Note model
module.exports = Note;