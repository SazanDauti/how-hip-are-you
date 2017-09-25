'use strict'

let request     = require('request-promise')
let queryString = require('query-string')
let Promise     = require('bluebird')
let uuid        = require('uuid')
let secret      = require('../config/secret')

let hip = Promise.method((accessToken) => {
  return getUserId(accessToken)
  .then((id) => {
    console.log(id)
    return id
  })
})

let getUserId = Promise.method((accessToken) => {
 let getUserOptions = {
    url: 'https://api.spotify.com/v1/me',
    auth: {
      'bearer': accessToken
    }
 }
 return request(getUserOptions)
 .then(response => {
    return JSON.parse(response).id
 })
})

module.exports = {
  hip: hip
}
