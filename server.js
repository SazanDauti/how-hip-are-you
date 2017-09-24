'use strict'

let express    = require('express')
let mongoose   = require('mongoose')
let uuid       = require('uuid')
let request    = require('request-promise')

require('./connect')()
mongoose.Promise = require('bluebird')

let app = express()
app.use(express.static(__dirname + '/public'))

app.get('/', (req, res) => {
  res.sendFile(__dirname, 'public/index.html')
})

app.listen(7070, (err) => {
  if (err) console.error(err)
  console.log('Listening on port 7070')
})
