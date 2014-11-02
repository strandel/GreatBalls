var express = require("express")
var logfmt = require("logfmt")
var Moves = require('moves')
var app = express()

var MOVES_ACCESS_TOKEN_COOKIE = 'mO4cc7Ok3n'

app.use(logfmt.requestLogger())
app.use(express.bodyParser())
app.use(express.static(__dirname + '/../www'))


var moves = new Moves({
    api_base: 'https://api.moves-app.com/api/1.1'
  , client_id: 'w26SoC75O014NGR_uNMm666I9b5tR8W5'
  , client_secret: 'OH0IWmwA_2Pfei2XY0Yrd664GFq47fk_vNlP5LVUGZ9_FDa21wW75SvOB756pG1Y'
  , redirect_uri: 'http://great-balls.herokuapp.com/api/receiveToken'
})

var dev = {
    toni_access_token: '8UtD8pCntnG60KlwvbohV17on4z0izUpt9bhbbPA0z58lX2SJ0kRYoYYQBYq21tl'
}

app.get('/api/month/current', function (req, res) {
  var accessToken = getAccessTokenFromCookie(req)
  if (accessToken) {
    myMoves.month(accessToken, function (activity) { 
      res.send(activity)
    })
  }
})

app.get('/api/authorize', function (req, res) {
  myMoves.askAuthorizationFromUser(res)
})

app.get('/api/receiveToken', function (req, res) {
  var authToken = req.query.code
  if (authToken) {
    myMoves.getAccessToken(authToken, function (error, token) {
      if (error) { console.error(error); return res.send(error) }
      console.log('### ' + token.access_token)
      console.log('### ' + token.refresh_token)
      console.log('### ' + token.expires_in)
      res.cookie(MOVES_ACCESS_TOKEN_COOKIE, token.access_token)
      res.redirect('/')
    })
  }
  else { return res.status(400).json({msg: '"code" url parameter missing'}) }
})

function getAccessTokenFromCookie(req) {
  if (req.query.devCookie) return dev.toni_access_token
  else return req.cookies && req.cookies[MOVES_ACCESS_TOKEN_COOKIE]
}

var myMoves = {
  askAuthorizationFromUser: function (res) {
    moves.authorize({
      scope: ['activity', 'location'] //can contain either activity, location or both
    , state: 'GreatBalls' //optional state as per oauth
    }, res)
  }  
, getAccessToken: function (authCode, callback) {
    moves.token(authCode, function (error, response, body) {
      callback(error, JSON.parse(body))
    })
  }
, month: function (accessToken, callback) {
    var now = new Date(), year = now.getFullYear(), month = now.getMonth() + 1
    moves.get('/user/summary/daily/' + year + month, accessToken, function (error, response, body) {
      if (error) { return console.error(error) }
      callback(JSON.parse(body))
    })
  }
}

console.log('\n**********************')
console.log('Great Balls on fire!!!\n')

var port = Number(process.env.PORT || 5000)
app.listen(port, function() {
  console.log('Listening on port ' + port)
  console.log('**********************\n')
})
