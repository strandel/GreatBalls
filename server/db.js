var Promise = require('bluebird')
var mongojs = require('mongojs')

var config = {
  mongo_uri: process.env.MONGODB_URL || 'mongodb://ballmover:jDk3-rP2m9.aCv4-kRE39@dogen.mongohq.com:10039/GreatBalls',
  mongo_collections: ['users']
}
var db = mongojs.connect(config.mongo_uri, config.mongo_collections)

module.exports = {
  users: Promise.promisifyAll(db.users, { suffix: 'P' })
}
