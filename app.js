const { Client } = require('whatsapp-web.js')
const express = require('express')
const socket = require('socket.io')
const port = process.env.PORT || 5000
const qrcode = require('qrcode')
const http = require('http')
const fs = require('fs')

const app = express()
const server = http.createServer(app)
const io = socket(server)

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

const SESSION_FILE_PATH = './whatsapp-session.json'
let sessionCfg;

if (fs.existsSync(SESSION_FILE_PATH)) {
    sessionCfg = require(SESSION_FILE_PATH);
}

app.get('/', (req, res) => {
    res.sendfile('index.html', { root: __dirname })
})

const client = new Client({ puppeteer: { headless: true }, session: sessionCfg })

client.on('authenticated', (session) => {
    console.log('AUTHENTICATED', session);
    sessionCfg=session;
    fs.writeFile(SESSION_FILE_PATH, JSON.stringify(session), function (err) {
        if (err) {
            console.error(err);
        }
    });
});

client.on('message', msg => {
    if (msg.body == 'P') {
        msg.reply('what');
    } else if (msg.body == 'Halo'){f
        msg.reply('Hai, ada yang bisa di bantu?')
    } else if (msg.body == '!Hai'){
        msg.reply('fuck you')
    }
});

client.initialize()

// Socket IO
io.on('connection', function(socket) {
    socket.emit('message', 'Connection...')

    client.on('qr', (qr) => {
        console.log('QR RECEIVED', qr)
        qrcode.toDataURL(qr, (err, url) => {
            socket.emit('qr', url)
            socket.emit('message', 'QR code received, scan please')
        })
    });

    client.on('ready', () => {
        socket.emit('message', 'Client is ready!')
    });
})

// Send message api
app.post('/send-message', (req, res) => {
    const number = req.body.number
    const message = req.body.message

    client.sendMessage(number, message).then(response => {
       res.status(200).json({ 
           status: true,
           response: response
       })
    }).catch(err => {
       res.status(500).json({
           status: false,
           response: err
       })
    })
})

server.listen(port, function(){
    console.log('App running on :' + port)
})