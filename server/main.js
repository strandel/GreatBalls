var express = require('express')
var logfmt = require('logfmt')
var Promise = require('bluebird')

var moves = require('./moves.js')
var db = require('./db.js')

var app = express()

app.use(logfmt.requestLogger())
app.use(express.bodyParser())
app.use(express.static(__dirname + '/../www'))


app.get('/api/cycling/:username/:year/:month', function (req, res) {
  var username = req.params.username
  var url = '/user/summary/daily/' + req.params.year + req.params.month
  console.log(' getting from moves >> [' + username + '] ' + url)

  getAccessTokenAsync(username)
    .then(function (movesToken) { return moves.getP(url, movesToken) })
    .spread(function (connectionObj, response) { return JSON.parse(response) })
    .map(function (dayJson) { return {"date": dayJson.date, "cycledMeters": cyclingMeters(dayJson.summary)} })
    .then(function (monthJson) { res.json(monthJson) })
    .catch(HttpError404, logAndSendError(res, 404))
    .catch(logAndSendError(res, 500))
})

function cyclingMeters(activityArr) {
  return activityArr
            .filter(function (activity) { return activity.activity === 'cycling' })
            .map(function (cycling) {return cycling.distance })
            [0]
}
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
  moves.authorize({
    scope: ['activity', 'location'] //can contain either activity, location or both
  , state: username
  }, res)
})

app.get('/api/receiveToken', function (req, res) {
  var authToken = req.query.code
  var username = req.query.state
  if (authToken) {
    moves.token(authCode, function (error, connectionObj, response) {
      if (error) { console.error(error); return res.status(500).json({ msg: error }) }
      var token = JSON.parse(response)
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

var port = Number(process.env.PORT || 5000)
app.listen(port, function() {
  console.log(
    '\n***********************' +
    '\nGreat Balls on fire!!!!\n' +
    '\nListening on port ' + port +
    '\n***********************\n'
  )
})
