var mongoose = require('mongoose');
var uuid = require('node-uuid');
var Schema = mongoose.Schema;

var bookSchema = new Schema({
  _id: {
    type: String, default: function genUUID() {
      return uuid.v1()
    }
  },
  title: {
    type: String,
    required: true
  },
  url: {
    type: String,
    required: true
  }
});

module.exports = mongoose.model('book', bookSchema);
