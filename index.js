'use strict'

const express = require('express')
const bodyParser = require('body-parser')
const request = require('request')
const app = express()
const token = 'EAAEWs25cLwoBADsVDl5a5D0SWvkdgAfupZCxSRP4VjMZBlDZCDGhkzDunPuSWmKPZA49LqkspZAtOdUNRmkho7Vy2ycEjBRLr4ZASf2zlKb3ZAYJgBbZAw7eBnZCoGtUJ6ZAJHIPcTgoc87mHZB8dTizp4CRMqt1FHH9eZCiZBijvbKYNyQZDZD'
const crypto = require('crypto')
const AppSecret = 'APP_YOUR_SECRET'
const momentTz = require('moment-timezone')
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

function crudTracking (userInput, cb) {
  const userInputArr = userInput.split('_')
  let slug = userInputArr[0]
  if (userInputArr[0] === 'pos') {
    slug = 'pos-indonesia'
  }
  const tracking_number = userInputArr[1]
  console.log(`slug: ${slug}, tracking_number: ${tracking_number}`)

  const body = {
    tracking: {
      slug,
      tracking_number
    }
  }

  Aftership.call('POST', '/trackings', { body }, function (err, result) {
    if (err && err.code === 4005) {
      console.log('err when add new tracking: ', err)
      return cb(unescape('\u274C Resi yang diinput tidak valid \uD83E\uDD14'))
    } else {
      console.log(`successfully add tracking: ${result}`)
      console.log(`going to call getTrackingStatus`)

      setTimeout(() => {
        getTrackingStatus(slug, tracking_number, (errGet, resultGet) => {
          removeTracking(slug, tracking_number) // one time creation of trackings
          if (errGet) {
            return cb(errGet)
          } else {
            return cb(resultGet)
          }
        })
      }, 5000)
    }
  })
}

function removeTracking (slug, tracking_number, cb) {
  Aftership.call('DELETE', `/trackings/${slug}/${tracking_number}`, function (err, result) {
    if (err) {
      console.log(`err when remove tracking for slug: ${slug}, tracking_number: ${tracking_number}`)
    } else {
      console.log(`sucessfully remove tracking: ${JSON.stringify(result)}`)
    }
  })
}

function getTrackingStatus (slug, tracking_number, cb) {
  Aftership.call('GET', `/trackings/${slug}/${tracking_number}`, function (err, result) {
    if (err) {
      console.log('err.message: ', err.message)
      return cb(unescape('\u274C Maaf, tracking tidak tersedia untuk record ini \uD83D\uDE2D'))
    } else if (result.data.tracking.checkpoints.length === 0) {
      console.log(`result.data.tracking.checkpoints.length: ${result.data.tracking.checkpoints.length}`)
      return cb(unescape('\u274C Maaf, tracking tidak tersedia untuk record ini \uD83D\uDE2D'))
    } else {
      const checkpoints = result.data.tracking.checkpoints
      const lastCheckpoint = checkpoints[checkpoints.length - 1]
      console.log('lastCheckpoint::::: ', lastCheckpoint)

      let extra
      if (lastCheckpoint.tag.toLowerCase().indexOf('deliver') >= 0 || lastCheckpoint.tag.toLowerCase().indexOf('complete') >= 0) {
        extra = unescape('Wah senangnya paketnya sudah sampai!! Horeee \uD83D\uDE06')
      } else {
        extra = unescape('Sabar yaa.. paketnya masih di jalan \uD83D\uDE09')
      }
      return cb(null, `Tracking No: ${tracking_number}` +
        `\nTime: ${formatDate(lastCheckpoint.checkpoint_time)}` +
        `\nStatus: ${lastCheckpoint.tag}` +
        `\nMessage: ${lastCheckpoint.message}\n\n${extra}`)
    }
  })
}

function sendTextMessage (sender, text, boolean) {
  let url = `https://graph.facebook.com/v2.6/${sender}?fields=first_name,last_name,profile_pic&access_token=${token}`
  let messageData = {
    text
  }

  if (boolean) {
    console.log('going to crudTracking... with text: ', text)
    crudTracking(text, (err, result) => {
      if (err) {
        messageData = {
          text: err
        }
      } else {
        messageData = {
          text: result
        }
      }
      console.log('text to be displayed: ', messageData)
      postToFb(url, sender, messageData)
    })
  } else {
    console.log('text to be displayed: ', messageData)
    postToFb(url, sender, messageData)
  }
}

function postToFb (url, sender, messageData) {
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
  // tiki_1234567890
  // pos_1234567890
  const strArr = str.trim().split('_')
  const courier = strArr[0]

  if (courier.toLowerCase() === 'jne' || courier.toLowerCase() === 'tiki' || courier.toLowerCase() === 'pos') {
    return true
  }

  console.log('checkUserInput false')
  return false
}

function formatDate (dateString) {
  return `${momentTz(dateString).tz('Asia/Bangkok').format('D MMM YYYY hh:mm A (Z)')}`
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
          unescape()
          sendTextMessage(messagingEvent.sender.id, unescape('Halo! Berikut daftar kurir yang bisa dilacak:' +
          '\n\uD83D\uDE9A JNE' +
          '\n\uD83D\uDE9A TIKI' +
          '\n\uD83D\uDE9A POS INDONESIA' +
          '\nMasukkan nomer resi paket dengan format:' +
          '\n[kurir]_[no resi]' +
          '\n\n\u2139 Contoh:' +
          '\n\u2714 jne_1234567890' +
          '\n\u2714 tiki_1234567890' +
          '\n\u2714 pos_1234567890'), false)
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
