'use strict'

const express = require('express')
const bodyParser = require('body-parser')
const request = require('request')
const app = express()
const token = 'EAAEWs25cLwoBADsVDl5a5D0SWvkdgAfupZCxSRP4VjMZBlDZCDGhkzDunPuSWmKPZA49LqkspZAtOdUNRmkho7Vy2ycEjBRLr4ZASf2zlKb3ZAYJgBbZAw7eBnZCoGtUJ6ZAJHIPcTgoc87mHZB8dTizp4CRMqt1FHH9eZCiZBijvbKYNyQZDZD'
const crypto = require('crypto')
const AppSecret = 'APP_YOUR_SECRET'

app.set('port', (process.env.PORT || 5000))

// Process application/x-www-form-urlencoded
app.use(bodyParser.json({verify: verifyRequestSignature}))

// Process application/json
app.use(bodyParser.json())

// Index route
app.get('/', function (req, res) {
  res.send('Hello world, I am a chat bot..')
})

function verifyRequestSignature (req, res, buf) {
  let signature = req.headers['x-hub-signature']

  if (!signature) {
    console.error('You dont have signature')
  } else {
    let element = signature.split('=')
    let signatureHash = element[1]
    let expectedHash = crypto.createHmac('sha1', AppSecret).update(buf).digest('hex')

    console.log('signatureHash = ', signatureHash)
    console.log('expectedHash = ', expectedHash)
    if (signatureHash !== expectedHash) {
      console.error('signature invalid, send message to email or save as log')
    }
  }
}

function sendTextMessage (sender, text) {
  let url = `https://graph.facebook.com/v2.6/${sender}?fields=first_name,last_name,profile_pic&access_token=${token}`

  request(url, function (error, response, body) {
    if (!error && response.statusCode === 200) {
      let parseData = JSON.parse(body)
      let messageData = {
        text
        // text: `Hi ${parseData.first_name} ${parseData.last_name}, you send message : ${text}`
        // text: `Hi ${parseData.first_name} ${parseData.last_name}, please enter your JNE tracking number with format 'jne_<tracking number>'`
      }
      request({
        url: 'https://graph.facebook.com/v2.10/me/messages',
        qs: {
          access_token: token
        },
        method: 'POST',
        json: {
          recipient: {
            id: sender
          },
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
  })
}

function checkUserInput (str) {
  // jne_1234567890
  const pattern = /^jne_\w*?$/i
  return pattern.test(str)
}

app.post('/webhook/', function (req, res) {
  let data = req.body
  if (data.object === 'page') {
    data.entry.forEach(function (pageEntry) {
      pageEntry.messaging.forEach(function (messagingEvent) {
        console.log(messagingEvent)
        if (checkUserInput(messagingEvent.message.text)) {
          sendTextMessage(messagingEvent.sender.id, 'Memeriksa paket anda')
        } else {
<<<<<<< HEAD
          sendTextMessage(messagingEvent.sender.id, 'Silahkan masukkan paket anda dengan format: jne_<no resi>\nContoh: jne_1234567890')
=======
          sendTextMessage(messagingEvent.sender.id, 'Silahkan masukkan paket anda dengan format: jne_<no resi>')
>>>>>>> 69c8fb58013cdc2b41bbe1af13d8d63458f1d5c6
        }
      })
    })
    res.sendStatus(200)
  }
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
