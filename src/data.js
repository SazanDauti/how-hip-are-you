'use strict'

let request     = require('request-promise')
let queryString = require('query-string')
let Promise     = require('bluebird')
let uuid        = require('uuid')
let _           = require('lodash')
let secret      = require('../config/secret')

let hip = Promise.method((accessToken) => {
  let userId
  let playlistIds
  return getUserId(accessToken)
  .then((id) => {
    userId = id
    return getUserPlaylistIds(userId, accessToken)
  })
  .then((ids) => {
    return getSongsFromPlaylist(userId, ids[10], accessToken)
  })
  .then((ids) => {
    console.log(ids)
    return userId
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

let getUserPlaylistIds = Promise.method((userId, accessToken) => {
  let limitMax = 10
  let getPlaylistsOptions = {
    url: 'https://api.spotify.com/v1/users/' + userId + '/playlists?limit=' + limitMax +'&offset=' + 0,
    auth: {
      'bearer': accessToken
    }
  }
  let playlistIds = []
  let hasRemainingPlaylists = false
  return request(getPlaylistsOptions)
  .then(response => {
    response = JSON.parse(response)
    response.items.forEach((item) => {
      playlistIds.push(item.id)
    })
    if (response.next != null) {
      hasRemainingPlaylists = true
      let remainingQueries = []
      let offset = response.limit
      while (offset <= response.total) {
        let url = 'https://api.spotify.com/v1/users/' + userId + '/playlists?limit=' + limitMax + '&offset=' + offset
        remainingQueries.push(getRemainingUserPlaylistIds(url, accessToken))
        offset += limitMax
      }
      return Promise.all(remainingQueries)
    } else {
      return playlistIds
    }
  })
  .then((response) => {
    if (hasRemainingPlaylists) {
      response.push(playlistIds)
      playlistIds = _.flatten(response)
    }
    return playlistIds
  })
  .catch((err) => {
    return []
  })
})

let getRemainingUserPlaylistIds = Promise.method((url, accessToken) => {
  let getPlaylistsOptions = {
    url: url,
    auth: {
      'bearer': accessToken
    }
  }
  return request(getPlaylistsOptions)
  .then(response => {
    let playlistIds = []
    response = JSON.parse(response)
    response.items.forEach((item) => {
      playlistIds.push(item.id)
    })
    return playlistIds
  })
})

let getSongsFromPlaylist = Promise.method((userId, playlistId, accessToken) => {
  let limitMax = 100
  let getSongsOptions = {
    url: 'https://api.spotify.com/v1/users/' + userId + '/playlists/' + playlistId + '/tracks?limit=100&offset=' + 0,
    auth: {
      'bearer': accessToken
    }
  }
  let songIds = []
  let hasRemainingSongs = false
  return request(getSongsOptions)
  .then(response => {
    response = JSON.parse(response)
    response.items.forEach((item) => {
      songIds.push({ id: item.track.id, hip: item.track.popularity })
    })
    if (response.next != null) {
      hasRemainingSongs = true
      let remainingQueries = []
      let offset = response.limit
      while (offset <= response.total) {
        let url = 'https://api.spotify.com/v1/users/' + userId + '/playlists/' + playlistId + '/tracks?limit=' + limitMax + '&offset=' + offset
        remainingQueries.push(getRemainingSongs(url, accessToken))
        offset += limitMax
      }
      return Promise.all(remainingQueries)
    } else {
      return songIds
    }
  })
  .then((response) => {
    if (hasRemainingSongs) {
      response.push(songIds)
      songIds = _.flatten(response)
    }
    return songIds
  })
  .catch((err) => {
    return []
  })
})

let getRemainingSongs = Promise.method((url, accessToken) => {
  let getSongsOptions = {
    url: url,
    auth: {
      'bearer': accessToken
    }
  }
  return request(getSongsOptions)
  .then(response => {
    let songIds = []
    response = JSON.parse(response)
    response.items.forEach((item) => {
      songIds.push({ id: item.track.id, hip: item.track.popularity })
    })
    return songIds
  })
})

module.exports = {
  hip: hip
}
