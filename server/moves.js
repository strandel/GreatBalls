var Moves = require('moves')
var Promise = require('bluebird')

var moves = new Moves({
    api_base: 'https://api.moves-app.com/api/1.1'
  , client_id: 'w26SoC75O014NGR_uNMm666I9b5tR8W5'
  , client_secret: 'OH0IWmwA_2Pfei2XY0Yrd664GFq47fk_vNlP5LVUGZ9_FDa21wW75SvOB756pG1Y'
  , redirect_uri: 'https://great-balls.herokuapp.com/api/receiveToken'
})

module.exports = Promise.promisifyAll(moves, {suffix: 'P' })
