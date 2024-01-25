var express = require('express');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var axios = require('axios');
const { getWordsList } = require('most-common-words-by-language');
const cyrillic = require('./cyrillic');
const latin = require('./latin');

var proxies = require('request-promise');
var lang = require('./language');
var bookSchema = require('./models/item');

var app = express();

var PORT = 8080;
var HOST_NAME = '127.0.0.1';
var DATABASE_NAME = 'bookUrlList';
var WAITING_TIME = 60000;
var MAX_WORDS = 10000;
var PER_WORDS = 50;

const proxyTypes = [
  'http', 'socks5'
];
const words = {};
const english = [];

mongoose.connect('mongodb://' + HOST_NAME + '/' + DATABASE_NAME);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));

app.listen(PORT, function () {
  console.log('Listening on port ' + PORT);
});

axios.defaults.headers.common["X-Requested-With"] = "XMLHttpRequest";

async function sendRequest(pageId, query, langId) {
  const language = lang[langId];
  const memoryUsage = process.memoryUsage();

  if(Math.round(memoryUsage.heapUsed / 1024 / 1024 / 1024) >= 8) {
    console.log('Heap memory exceed!!!');
    setTimeout(() => {
      sendRequest(pageId, query, langId);
    }, 60000);
    return;
  }
  if(words[language] === undefined || language === undefined) {
    console.log(`${language} : ${words[language]} (${query})`);
    return ;
  }
  
  const queryParam = encodeURIComponent(words[language][query]);
  const queryUrl = `https://www.everand.com/search/query?query=${queryParam}&content_type=books&page=${pageId}`;
  const queryProxy = `${proxyTypes[Math.floor(Math.random() * 2)]}://gkmyqsuy-rotate:usbx1luz1evf@p.webshare.io:80`;

  proxies ({
    url: queryUrl,
    proxy: queryProxy
  }).then(function(res) {
    let data = JSON.parse(res);
    if(data === undefined)
      return;

    console.log(`${pageId}/${data.page_count} - ${queryParam} (${language} : ${query}) : ${WAITING_TIME / 1000}s  Heap Used: ${Math.round(memoryUsage.heapUsed / 1024 / 1024)} MB`);
    const books = data.results.books.content.documents;
    books.map((book, id) => {
      bookSchema.create({title: book.title, url: book.book_preview_url, language: book.language.name, search: query})
        .catch(error => {
          if (error.code !== 11000) {
            console.log("Error:", error);
          } else {
          }
       });
    });

    if(pageId < data.page_count && pageId <= 234)
      sendRequest(pageId+1, query, langId);
    else {
      if(langId + 1 < lang.length)
        sendRequest(1, query, langId+1);
    }
  }, function(err) {
    console.log(`sending request error to ${queryUrl}:${queryProxy}`);
    setTimeout(() => { sendRequest(pageId, query, langId); }, WAITING_TIME);
  });
}

async function sendEnglishRequest(pageId, query, cnt) {
  const memoryUsage = process.memoryUsage();

  if(Math.round(memoryUsage.heapUsed / 1024 / 1024 / 1024) >= 8) {
    console.log('Heap memory exceed!!!');
    setTimeout(() => {
      sendRequest(pageId, query, cnt);
    }, 60000);
    return;
  }
  
  const queryParam = english[query+cnt];
  const queryUrl = `https://www.everand.com/search/query?query=${queryParam}&content_type=books&page=${pageId}`;
  const queryProxy = `${proxyTypes[Math.floor(Math.random() * 2)]}://gkmyqsuy-rotate:usbx1luz1evf@p.webshare.io:80`;

  proxies ({
    url: queryUrl,
    proxy: queryProxy
  }).then(function(res) {
    let data = JSON.parse(res);
    if(data === undefined)
      return;

    console.log(`${pageId}/${data.page_count} - ${queryParam} (${language} : ${query}) Heap Used: ${Math.round(memoryUsage.heapUsed / 1024 / 1024)} MB`);
    const books = data.results.books.content.documents;
    books.map(book => {
      bookSchema.create({title: book.title, url: book.book_preview_url, language: book.language.name, search: query+cnt})
        .catch(error => {
          if (error.code !== 11000) {
            console.log("Error:", error);
          } else {
          }
       });
    });

    if(pageId < data.page_count && pageId <= 234)
      sendRequest(pageId+1, query, cnt+1);
    else {
      if(cnt + 1 < PER_WORDS)
        sendRequest(1, query, cnt+1);
    }
  }, function(err) {
    console.log(`sending request error to ${queryUrl}:${queryProxy}`);
    setTimeout(() => { sendRequest(pageId, query, cnt); }, WAITING_TIME);
  });
}


// async function SearchBooks(language) {
//   sendRequest(1, 0, language);
// }

async function SearchEnglishBooks(ind) {
  sendEnglishRequest(1, ind * PER_WORDS, 0);
}


mongoose.connection.once('open', function () {
  console.log('Connected to MongoDB');

  // lang.map(language => {
  //   words[language] = getWordsList(language, 1000);
  // });
  // words["latin"] = latin;
  // words["cyrillic"] = cyrillic;
  // lang.push("latin");
  // lang.push("cyrillic");

  // setTimeout(() => {
  //   // lang.map(language => {
  //   //   SearchBooks(language);
  //   // });
    
  //   for(var i = 300; i < MAX_WORDS; i++) {
  //     SearchBooks_Word(i);
  //   }
  // }, 1000);


  english = getWordsList("english", 10000);
  setTimeout(() => {
    for(var i = 1; i < 200; i++) {
      SearchEnglishBooks(i);
    }
  }, 1000);
});
