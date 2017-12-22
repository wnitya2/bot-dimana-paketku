'use strict'

const express = require('express')
const bodyParser = require('body-parser')
const request = require('request')
const app = express()
const token = 'EAAEWs25cLwoBADsVDl5a5D0SWvkdgAfupZCxSRP4VjMZBlDZCDGhkzDunPuSWmKPZA49LqkspZAtOdUNRmkho7Vy2ycEjBRLr4ZASf2zlKb3ZAYJgBbZAw7eBnZCoGtUJ6ZAJHIPcTgoc87mHZB8dTizp4CRMqt1FHH9eZCiZBijvbKYNyQZDZD'
const crypto = require('crypto')
const AppSecret = 'APP_YOUR_SECRET'
// const Aftership = require('aftership')(process.env.AFKUNCI)
const Aftership = require('aftership')('26fc173a-725e-4fab-9193-4da0f160403d')

app.set('port', (process.env.PORT || 5000))

// Process application/x-www-form-urlencoded
app.use(bodyParser.json({verify: verifyRequestSignature}))

// Process application/json
app.use(bodyParser.json())

// Index route
app.get('/', function (req, res) {
  res.send('Dimana Paketku Facebook bot. Check it out here https://www.facebook.com/Dimana-Paketku-833111273538199/')
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

function getPacketStatus (userInput) {
  const courrier = userInput.substring(0, 3)
  const trackNo = userInput.substring(4, userInput.length - 1)

  console.log(`courrier: ${courrier}, trackNo: ${trackNo}`)

  Aftership.call('GET', `/trackings/${courrier}/${trackNo}`, function (err, result) {
    if (err) {
      console.log('err from aftership: ', err)
      console.log('err.message: ', err.message)
      return err.message
    } else {
      const lastCheckpoint = result.data.tracking.checkpoints[result.data.tracking.checkpoints.length - 1]
      console.log('lastCheckpoint: ', lastCheckpoint)
      console.log(`Tracking No: ${trackNo}\nStatus: ${lastCheckpoint.tag}\nMessage: ${lastCheckpoint.message}`)
      return `Tracking No: ${trackNo}\nStatus: ${lastCheckpoint.tag}\nMessage: ${lastCheckpoint.message}`
    }
  })
}

function sendTextMessage (sender, text, boolean) {
  let url = `https://graph.facebook.com/v2.6/${sender}?fields=first_name,last_name,profile_pic&access_token=${token}`
  let messageData = {
    text
  }
  if (boolean) {
    console.log('going to getPacketStatus... with text: ', text)
    messageData = {
      text: getPacketStatus(text)
    }
  }

  console.log('text to be displayed: ', messageData)
  request(url, function (error, response, body) {
    if (!error && response.statusCode === 200) {
      // let parseData = JSON.parse(body)
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
          sendTextMessage(messagingEvent.sender.id, messagingEvent.message.text, true)
        } else {
          sendTextMessage(messagingEvent.sender.id, 'Silahkan masukkan paket anda dengan format: jne_<no resi>\nContoh: jne_1234567890', false)
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
