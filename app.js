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

async function sendRequest(pageId, query) {
  axios.get(`https://www.everand.com//search/query?query=${String.fromCharCode(97 + query)}&content_type=books&page=${pageId}`)
      .then(response => {
        const data = response.data;
        
        console.log(`${pageId}/${data.page_count} - ${String.fromCharCode(97 + query)}`);
        const books = data.results.books.content.documents;
        books.map((book) => {
          let book_instance = new bookSchema({title: book.title, url: book.book_preview_url});
          
          bookSchema.find({ title: book.title }).then(books => {
            if(books.length == 0) {
              book_instance.save()
              .then(res => {
                console.log(res.title);
              })
              .catch(error => {
                console.log(error);
              });
            }
          });

        });

        if(pageId < data.page_count)
          sendRequest(pageId+1, query);
      })
      .catch(error => {
        console.log(error);
      })
}

mongoose.connection.once('open', function () {
  console.log('Connected to MongoDB');

  for(var i = 0; i <= 26; i++) {
    sendRequest(1, i);
  }
});
