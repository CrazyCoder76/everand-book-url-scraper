var express = require('express');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var axios = require('axios');
const { getWordsList } = require('most-common-words-by-language');

var proxies = require('./proxy');
var lang = require('./language');
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

async function sendRequest(pageId, query, language) {
  const proxy_id = Math.floor((Math.random() * proxies.length));
  const memoryUsage = process.memoryUsage();
  
  axios.get(`https://www.everand.com//search/query?query=${query}&content_type=books&page=${pageId}`, {proxy: proxies[proxy_id] })
      .then(response => {
        const data = response.data;
        
        console.log(`${pageId}/${data.page_count} - ${query} (${proxy_id}) : ${WAITING_TIME / 1000}s  Heap Used: ${Math.round(memoryUsage.heapUsed / 1024 / 1024)} MB`);
        const books = data.results.books.content.documents;
        books.map((book) => {
          try {
            bookSchema.create({title: book.title, url: book.book_preview_url, language: language, search: query});
          } catch (error) {
            if(error.code != 11000) {
              console.log("saving database error");
            }
          }
        });

        if(pageId < data.page_count && pageId <= 235)
          sendRequest(pageId+1, query);
      })
      .catch(error => {
        console.log(`sending request error :${WAITING_TIME / 1000}s`);
        setTimeout(() => { sendRequest(pageId, query); }, WAITING_TIME);
      })
}

async function SearchBooks(language) {
  const words = getWordsList(language, 3000);
  for(var i = 0; i < words.length; i++) {
    await sendRequest(1, words[i], language);
  }
}

mongoose.connection.once('open', function () {
  console.log('Connected to MongoDB');

  lang.map(language => {
    SearchBooks(language);
  });
});
