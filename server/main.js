var express = require("express")
var logfmt = require("logfmt")
var Moves = require('moves')
var app = express()

app.use(logfmt.requestLogger());


var moves = new Moves({
    client_id: 'w26SoC75O014NGR_uNMm666I9b5tR8W5'
  , client_secret: 'OH0IWmwA_2Pfei2XY0Yrd664GFq47fk_vNlP5LVUGZ9_FDa21wW75SvOB756pG1Y'
  , redirect_uri: 'http://great-balls.herokuapp.com/ShowBalls'
})

app.get('/', function(req, res) {
  moves.authorize({
      scope: ['activity', 'location'] //can contain either activity, location or both
    , state: 'GreatBalls' //optional state as per oauth
  }, res)
});

app.get('ShowBalls', function (req, res) {
  moves.token('code returned from authorize step above', function(error, response, body) {
    if (error) {
      console.error(error)
      return 
    }
    var access_token = body.access_token
      , refresh_token = body.refresh_token
      , expires_in = body.expires_in
    console.log('access token: ' + access_token)
    console.log('refresh token: ' + refresh_token)
    console.log('expires in: ' + expires_in)
  })
})

var port = Number(process.env.PORT || 5000);
app.listen(port, function() {
  console.log("Listening on " + port);
});

console.log('Great Balls on fire!!!')
