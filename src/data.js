'use strict'

let request     = require('request-promise')
let queryString = require('query-string')
let Promise     = require('bluebird')
let uuid        = require('uuid')
let _           = require('lodash')
let secret      = require('../config/secret')
let Song        = require('../models/song.js')

let hip = Promise.method((accessToken, userId) => {
  return getUserPlaylistIds(userId, accessToken)
  .then((playlists) => {
    let songQueries = []
    playlists.forEach((playlist) => {
      songQueries.push(getSongsFromPlaylist(playlist.owner, playlist.id, accessToken))
    })
    return Promise.all(songQueries)
  })
  .then((songs) => {
    songs = _.flatten(songs)
    songs = _.uniqBy(songs, 'songId')
    if (songs.length > 0) {
      return updateDb(userId, songs)
    } else {
      return null
    }
  })
})

let updateDb = Promise.method((userId, songs) => {
  console.log(songs.length)
  return Song.remove({
    user: userId
  })
  .then((status) => {
    return Song.insertMany(songs)
  })
  .then((status) => {
    return
  })
  .catch((err) => {
    console.log(err)
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
    response = JSON.parse(response)
    hip(accessToken, response.id)
    return response.id
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
  let playlists = []
  let hasRemainingPlaylists = false
  return request(getPlaylistsOptions)
  .then(response => {
    response = JSON.parse(response)
    response.items.forEach((item) => {
      playlists.push({ owner: item.owner.id, id: item.id })
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
      return playlists
    }
  })
  .then((response) => {
    if (hasRemainingPlaylists) {
      response.push(playlists)
      playlists = _.flatten(response)
    }
    return playlists
  })
  .catch((err) => {
    if (err.statusCode == 429) {
      Promise.delay(500)
      return getUserPlaylistIds(userId, accessToken)
    }
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
    let playlists = []
    response = JSON.parse(response)
    response.items.forEach((item) => {
      playlists.push({ owner: item.owner.id, id: item.id })
    })
    return playlists
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
      songIds.push({ _id: uuid(), songId: item.track.id, user: userId, popularity: item.track.popularity })
    })
    if (response.next != null) {
      hasRemainingSongs = true
      let remainingQueries = []
      let offset = response.limit
      while (offset <= response.total) {
        let url = 'https://api.spotify.com/v1/users/' + userId + '/playlists/' + playlistId + '/tracks?limit=' + limitMax + '&offset=' + offset
        remainingQueries.push(getRemainingSongs(url, accessToken, userId))
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
    if (err.statusCode == 429) {
      Promise.delay(500)
      return getSongsFromPlaylist(userId, playlistId, accessToken)
    }
    return []
  })
})

let getRemainingSongs = Promise.method((url, accessToken, userId) => {
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
      songIds.push({ _id: uuid(), songId: item.track.id, user: userId, popularity: item.track.popularity })
    })
    return songIds
  })
})

module.exports = {
  getUserId: getUserId
}
