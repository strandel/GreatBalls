var express = require("express")
var logfmt = require("logfmt")
var Moves = require('moves')

var app = express()

app.use(logfmt.requestLogger())
app.use(express.bodyParser())
app.use(express.static(__dirname + '/../www'))

var moves = new Moves({
    api_base: 'https://api.moves-app.com/api/1.1'
  , client_id: 'w26SoC75O014NGR_uNMm666I9b5tR8W5'
  , client_secret: 'OH0IWmwA_2Pfei2XY0Yrd664GFq47fk_vNlP5LVUGZ9_FDa21wW75SvOB756pG1Y'
  , redirect_uri: 'https://great-balls.herokuapp.com/api/receiveToken'
})

var config = {
  mongo_uri: process.env.MONGODB_URL || 'mongodb://ballmover:jDk3-rP2m9.aCv4-kRE39@dogen.mongohq.com:10039/GreatBalls',
  mongo_collections: ['users']
}
var db = require("mongojs").connect(config.mongo_uri, config.mongo_collections)

app.get('/api/cycling/:username/:year/:month', function (req, res) {
  var username = req.params.username
  var year = req.params.year
  var month = req.params.month
  db.users.findOne({ 'username': username }, function (err, user) {
    if (err) { return res.status(500).json({ msg: err }) }
    else if (!user) { return res.status(404).json({ msg: 'no such user: ' + username }) }

    moves.get('/user/summary/daily/' + year + month, user.access_token, movesResponseHandler(function (error, monthJson) {
      if (error) { return res.status(500).json({ msg: error }) }
      res.json(monthJson)
    }))
  })
})

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

      db.users.save(newUser, function(err, saved) {
        if( err || !saved ) { console.error('ERROR saving user: ' + err); res.status(500).json({ msg: err }) }
        console.log(" >> User saved to mongo\n")
        // TODO: redirect to page with username , e.g. res.redirect('/' + username)
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
, month: function (accessToken, callback) {
    var now = new Date(), year = now.getFullYear(), month = now.getMonth() + 1
    moves.get('/user/summary/daily/' + year + month, accessToken, movesResponseHandler(callback))
  }
}

function movesResponseHandler(callback) { 
  return function (error, response, body) { callback(error, JSON.parse(body)) }
}

console.log('\n**********************')
console.log('Great Balls on fire!!!\n')

var port = Number(process.env.PORT || 5000)
app.listen(port, function() {
  console.log('Listening on port ' + port)
  console.log('**********************\n')
})
