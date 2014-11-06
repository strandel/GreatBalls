var express = require('express')
var logfmt = require('logfmt')
var Moves = require('moves')
var Promise = require('bluebird')

var app = express()

app.use(logfmt.requestLogger())
app.use(express.bodyParser())
app.use(express.static(__dirname + '/../www'))

var _moves = new Moves({
    api_base: 'https://api.moves-app.com/api/1.1'
  , client_id: 'w26SoC75O014NGR_uNMm666I9b5tR8W5'
  , client_secret: 'OH0IWmwA_2Pfei2XY0Yrd664GFq47fk_vNlP5LVUGZ9_FDa21wW75SvOB756pG1Y'
  , redirect_uri: 'https://great-balls.herokuapp.com/api/receiveToken'
})

var config = {
  mongo_uri: process.env.MONGODB_URL || 'mongodb://ballmover:jDk3-rP2m9.aCv4-kRE39@dogen.mongohq.com:10039/GreatBalls',
  mongo_collections: ['users']
}
var _db = require('mongojs').connect(config.mongo_uri, config.mongo_collections)

var db = {
  users: Promise.promisifyAll(_db.users, { suffix: 'P' })
}
var moves = Promise.promisifyAll(_moves, {suffix: 'P' })

app.get('/api/cycling/:username/:year/:month', function (req, res) {
  var username = req.params.username
  var url = '/user/summary/daily/' + req.params.year + req.params.month
  console.log(' getting from moves >> [' + username + '] ' + url)

  getAccessTokenAsync(username)
    .then(function (movesToken) { return moves.getP(url, movesToken) })
    .spread(function (connectionObj, response) { return JSON.parse(response) })
    .then(function (monthJson) { res.json(monthJson) })
    .catch(HttpError404, logAndSendError(res, 404))
    .catch(logAndSendError(res, 500))
})

function getAccessTokenAsync(username) {
  return db.users.findOneP({ 'username': username }).then(function (user) {
    if (!user) { throw new HttpError404('no such user: ' + username) }
    return user.access_token
  })
}
function logAndSendError(res, statusCode) {
  return function (err) {
    console.error(err)
    res.status(statusCode).json({ msg: err.message })
  }
}

function HttpError404(msg) { this.name = 'HttpError404'; this.message = msg || 'requested resource not found' }
HttpError404.prototype = Object.create(Error.prototype)

app.get('/api/authorize/:username', function (req, res) {
  var username = req.params.username
  if (!username) { return res.status(400).json({ msg: 'correct url is "/api/authorize/:username"' })}
  // TODO: check username does not yet exist in db
  myMoves.askAuthorizationFromUser(res, username)
})

app.get('/api/receiveToken', function (req, res) {
  var authToken = req.query.code
  var username = req.query.state
  if (authToken) {
    myMoves.getAccessToken(authToken, function (error, token) {
      if (error) { console.error(error); return res.status(500).json({ msg: error }) }
      var newUser = {
        username: username
      , access_token: token.access_token
      , refresh_token: token.refresh_token
      , expires_in: token.expires_in
      }
      console.log(' >> Adding new user: ' + JSON.stringify(newUser))

      db.users.save(newUser, function(err, savedUser) {
        if( err || !savedUser ) { console.error('ERROR saving user: ' + err); res.status(500).json({ msg: err }) }
        console.log(' >> User saved to mongo with id: ' + savedUser._id)
        res.redirect('/api/cycling/' + username + '/2014/03')
      })
    })
  }
  else { return res.status(400).json({ msg: '"code" url parameter missing' })}
})

var myMoves = {
  askAuthorizationFromUser: function (res, username) {
    moves.authorize({
      scope: ['activity', 'location'] //can contain either activity, location or both
    , state: username
    }, res)
  }  
, getAccessToken: function (authCode, callback) {
    moves.token(authCode, movesResponseHandler(callback))
  }
}

function movesResponseHandler(callback) { 
  return function (error, response, body) { callback(error, JSON.parse(body)) }
}

var port = Number(process.env.PORT || 5000)
app.listen(port, function() {
  console.log(
    '\n***********************' +
    '\nGreat Balls on fire!!!!\n' +
    '\nListening on port ' + port +
    '\n***********************\n'
  )
})
