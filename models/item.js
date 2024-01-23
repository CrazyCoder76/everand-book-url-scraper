var mongoose = require('mongoose');
var uuid = require('node-uuid');
var Schema = mongoose.Schema;

var bookSchema = new Schema({
  title: {
    type: String,
    unique: true
  },
  url: {
    type: String
  },
  language: {
    type: String
  },
  search: {
    type: String
  }
});

module.exports = mongoose.model('book', bookSchema);
