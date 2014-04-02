var express = require("express")
var logfmt = require("logfmt")
var Moves = require('moves')
var app = express()

var MOVES_ACCESS_TOKEN_COOKIE = 'mO4cc7Ok3n'

app.use(logfmt.requestLogger());


var moves = new Moves({
    api_base: 'https://api.moves-app.com/api/1.1'
  , client_id: 'w26SoC75O014NGR_uNMm666I9b5tR8W5'
  , client_secret: 'OH0IWmwA_2Pfei2XY0Yrd664GFq47fk_vNlP5LVUGZ9_FDa21wW75SvOB756pG1Y'
  , redirect_uri: 'http://great-balls.herokuapp.com/ShowBalls'
})

app.get('/', function (req, res) {
  if (req.signedCookies[MOVES_ACCESS_TOKEN_COOKIE]) {

  moves.authorize({
      scope: ['activity', 'location'] //can contain either activity, location or both
    , state: 'GreatBalls' //optional state as per oauth
  }, res)
});

app.get('/ShowBalls', function (req, res) {
  } else {
    var authCode = req.query.code
    if (!authCode) {res.redirect_uri('/')}
    accessToken(req.query.code, function (token) {
      res.cookie(MOVES_ACCESS_TOKEN_COOKIE, token.access_token, {domain: 'great-balls.herokuapp.com', signed: true, http_only: false})
      myMoves.month(token.access_token, function (activity) {
        res.send(activity)
      })
    })
  }
})

var myMoves = {
  accessToken: function (authCode, callback) {
    moves.token(authCode, function (error, response, body) {
      if (error) {
        console.error(error)
        return 
      }
      callback(JSON.parse(body))
    })
  }
, month: function (accessToken, callback) {
    var now = new Date(), year = now.getFullYear(), month = now.getMonth() + 1
    moves.get('/user/summary/daily/' + year + month, accessToken, function (error, response, body) {
      if (error) {
        console.error(error)
        return 
      }
      callback(JSON.parse(body))
    })
  }
}

var port = Number(process.env.PORT || 5000);
app.listen(port, function() {
  console.log("Listening on " + port);
});

console.log('Great Balls on fire!!!')
