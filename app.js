var express = require('express');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var axios = require('axios');

var bookSchema = require('./models/item');

var app = express();

var PORT = 8080;
var HOST_NAME = '127.0.0.1';
var DATABASE_NAME = 'bookUrlList';

var request_count = 100;
var request_index = 0;
var interval = null;

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
  axios.get(`https://www.everand.com/books/${category}/explore-more?page=${pageId}`)
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
async function sendRequests() {
  let startId = request_index * request_count + 1;
  let endId = (request_index+1) * request_count;
  request_index ++;
  for(let i = startId; i <= endId; i++)
    await sendRequest(i, "Computers");
  if(request_index > 10000) 
    clearInterval(interval);
}

mongoose.connection.once('open', function () {
  console.log('Connected to MongoDB');

  interval = setInterval(sendRequests, 2000);
});


