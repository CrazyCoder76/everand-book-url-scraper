var express = require('express');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var axios = require('axios');

var proxies = require('./proxy');

var bookSchema = require('./models/item');

var app = express();

var PORT = 8080;
var HOST_NAME = '127.0.0.1';
var DATABASE_NAME = 'bookUrlList';
var WAITING_TIME = 300000;

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
  const proxy_id = Math.floor((Math.random() * proxies.length));

  axios.get(`https://www.everand.com//search/query?query=${String.fromCharCode(97 + query)}&content_type=books&page=${pageId}`, {proxy: proxies[proxy_id] })
      .then(response => {
        const data = response.data;
        
        console.log(`${pageId}/${data.page_count} - ${String.fromCharCode(97 + query)} (${proxy_id}) : ${WAITING_TIME / 1000}s`);
        const books = data.results.books.content.documents;
        books.map((book) => {
          let book_instance = new bookSchema({title: book.title, url: book.book_preview_url});
          
          bookSchema.find({ title: book.title }).then(books => {
            if(books.length == 0) {
              book_instance.save()
              .then(res => {
              })
              .catch(error => {
                console.log("saving database error");
              });
            }
          });

        });

        if(pageId < data.page_count)
          sendRequest(pageId+1, query);
      })
      .catch(error => {
        console.log(`sending request error :${WAITING_TIME / 1000}s`);
        setTimeout(() => { sendRequest(pageId, query); }, WAITING_TIME);
      })
}

mongoose.connection.once('open', function () {
  console.log('Connected to MongoDB');

  for(var i = 0; i < 26; i++)
    sendRequest(1, 0);
});
