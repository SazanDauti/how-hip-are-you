'use strict'

let express     = require('express')
let mongoose    = require('mongoose')
let request     = require('request-promise')
let queryString = require('query-string')
let Promise     = require('bluebird')
let secret      = require('./config/secret')
let data        = require('./src/data')

require('./connect')()
mongoose.Promise = Promise

let app = express()
app.use(express.static(__dirname + '/public'))

app.get('/', (req, res) => {
  res.sendFile(__dirname, 'public/index.html')
})

app.get('/login', (req, res) => {
  res.redirect('https://accounts.spotify.com/authorize?' +
    queryString.stringify({
      response_type: 'code',
      client_id: secret.clientId,
      scope: secret.scope,
      redirect_uri: secret.redirect
    })
  )
})

app.get('/callback', function(req, res) {
  let authOptions = {
    method: 'POST',
    url: 'https://accounts.spotify.com/api/token',
    form: {
      code: req.query.code,
      redirect_uri: secret.redirect,
      grant_type: 'authorization_code'
    },
    headers: {
      'Authorization': 'Basic ' + (new Buffer(secret.clientId + ':' + secret.secret).toString('base64'))
    },
    json: true
  }
  request(authOptions)
  .then((response) => {
    return data.hip(response.access_token)
  })
  .then((id) => {
    res.redirect('/hip/' + id)
  })
  .catch((err) => {
    console.error(err)
    res.redirect('/error')
  })
})

app.get('/error', (req, res) => {
  res.send('Sorry, something went wrong. Redirecting to homepage in a few seconds.<script>setTimeout(() => { window.location.replace("/") }, 5000)</script>')
})

app.listen(7070, (err) => {
  if (err) console.error(err)
  console.log('Listening on port 7070')
})
