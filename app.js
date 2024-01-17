var express = require('express');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var axios = require('axios');

var bookSchema = require('./models/item');

var app = express();

var PORT = 8080;
var HOST_NAME = '127.0.0.1';
var DATABASE_NAME = 'bookUrlList';

var maxPages = 200000;

mongoose.connect('mongodb://' + HOST_NAME + '/' + DATABASE_NAME);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));

app.listen(PORT, function () {
  console.log('Listening on port ' + PORT);
});

axios.defaults.headers.common["X-Requested-With"] = "XMLHttpRequest";

async function sendRequest(pageId, category) {
  axios.get(`https://www.everand.com//search/query?query=a&content_type=books&page=${pageId}`)
      .then(response => {
        const data = response.data;
        var cnt = 0;
        
        console.log(`${pageId}/${data.page_count}`);
        const documents = data.results.books.documents;
        for(let key in documents) {
          console.log(key);
          let book_instance = new bookSchema({title: key.title, url: key.book_preview_url});

          book_instance.save()
            .then(res => {
              console.log(res.title);
            })
            .catch(error => {
              console.log(error);
            });
          cnt++;
        }
        console.log(cnt);
        if(pageId < data.page_count)
          sendRequest(pageId+1, category);
      })
      .catch(error => {
        console.log(error);
      })
}

mongoose.connection.once('open', function () {
  console.log('Connected to MongoDB');

  sendRequest(1, "Computers");
});


