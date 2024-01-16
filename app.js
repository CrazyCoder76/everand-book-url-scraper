var express = require('express');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var axios = require('axios');

var bookSchema = require('./models/item');

var app = express();

var PORT = 8080;
var HOST_NAME = '127.0.0.1';
var DATABASE_NAME = 'bookUrlList';

mongoose.connect('mongodb://' + HOST_NAME + '/' + DATABASE_NAME);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));

app.listen(PORT, function () {
  console.log('Listening on port ' + PORT);
});

axios.defaults.headers.common["X-Requested-With"] = "XMLHttpRequest";
mongoose.connection.once('open', function () {
  console.log('Connected to MongoDB');

  for(let i = 1; i <= 2; i++) {
    axios.get(`https://www.everand.com/books/Computers/explore-more?page=${i}`)
      .then(response => {
        const data = response.data;
        for(let key in data.documents) {
          let book_instance = new bookSchema({title: data.documents[key].title, url: data.documents[key].previewUrl});

          book_instance.save()
            .then(res => {
              console.log(res);
            })
            .catch(error => {
              console.log(error);
            });
        }
      })
      .catch(error => {
        console.log(error);
      })
  }
});


