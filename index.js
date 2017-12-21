'use strict'

const express = require('express')
const bodyParser = require('body-parser')
const request = require('request')
const app = express()
const token = 'EAAEWs25cLwoBADsVDl5a5D0SWvkdgAfupZCxSRP4VjMZBlDZCDGhkzDunPuSWmKPZA49LqkspZAtOdUNRmkho7Vy2ycEjBRLr4ZASf2zlKb3ZAYJgBbZAw7eBnZCoGtUJ6ZAJHIPcTgoc87mHZB8dTizp4CRMqt1FHH9eZCiZBijvbKYNyQZDZD'

app.set('port', (process.env.PORT || 5000))

// Process application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({extended: false}))

// Process application/json
app.use(bodyParser.json())

// Index route
app.get('/', function (req, res) {
  res.send('Hello world, I am a chat bot..')
})

function sendTextMessage (sender, text) {
  let messageData = { text: text }
  request({
    url: 'https://graph.facebook.com/v2.6/me/messages',
    qs: {access_token: token},
    method: 'POST',
    json: {
      recipient: {id: sender},
      message: messageData
    }
  }, function (error, response, body) {
    if (error) {
      console.log('Error sending messages: ', error)
    } else if (response.body.error) {
      console.log('Error: ', response.body.error)
    }
  })
}

app.post('/webhook/', function (req, res) {
  let messagingEvents = req.body.entry[0].messaging
  for (let i = 0; i < messagingEvents.length; i++) {
    let event = req.body.entry[0].messaging[i]
    let sender = event.sender.id
    if (event.message && event.message.text) {
      let text = event.message.text
      sendTextMessage(sender, 'Text received, echo: ' + text.substring(0, 200))
    }
  }
  res.sendStatus(200)
})

// for Facebook verification
app.get('/webhook/', function (req, res) {
  if (req.query['hub.verify_token'] === 'bot_dimana_paketku') {
    res.send(req.query['hub.challenge'])
  }
  res.send('Error, wrong token')
})

// Spin up the server
app.listen(app.get('port'), function () {
  console.log('running on port', app.get('port'))
})
