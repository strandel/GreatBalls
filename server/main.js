var express = require("express")
var logfmt = require("logfmt")
var moves = require("moves")
var app = express()

app.use(logfmt.requestLogger());

app.get('/', function(req, res) {
  res.send('Hello World!');
});

var port = Number(process.env.PORT || 5000);
app.listen(port, function() {
  console.log("Listening on " + port);
});

console.log('Great Balls on fire!!!')
