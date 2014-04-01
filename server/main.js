var express = require("express")
var logfmt = require("logfmt")
var Moves = require('moves')
var app = express()

app.use(logfmt.requestLogger());


var moves = new Moves({
    api_base: 'https://api.moves-app.com/api/1.1'
  , client_id: 'w26SoC75O014NGR_uNMm666I9b5tR8W5'
  , client_secret: 'OH0IWmwA_2Pfei2XY0Yrd664GFq47fk_vNlP5LVUGZ9_FDa21wW75SvOB756pG1Y'
  , redirect_uri: 'http://great-balls.herokuapp.com/ShowBalls'
})

app.get('/', function (req, res) {
  moves.authorize({
      scope: ['activity', 'location'] //can contain either activity, location or both
    , state: 'GreatBalls' //optional state as per oauth
  }, res)
});

app.get('/ShowBalls', function (req, res) {
  moves.token(req.query.code, function (error, response, body) {
    var tokenJson = JSON.parse(body)
    if (error) {
      console.error(error)
      return 
    }
    var access_token = tokenJson.access_token
      , refresh_token = tokenJson.refresh_token
      , expires_in = tokenJson.expires_in
    res.send(access_token)
  })
})

var port = Number(process.env.PORT || 5000);
app.listen(port, function() {
  console.log("Listening on " + port);
});

console.log('Great Balls on fire!!!')
