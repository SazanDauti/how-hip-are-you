'use strict'

let mongoose = require('mongoose')

let SongSchema = mongoose.Schema({
  _id: String,
  songId: String,
  user: String,
  popularity: Number
})

module.exports = mongoose.model('Song', SongSchema, 'songs')
