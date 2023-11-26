const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(express.static(path.join(__dirname, 'public')));

wss.on('connection', function connection(ws) {
    ws.on('message', function incoming(message) {
        console.log('received: %s', message);
        // Here you can handle incoming messages
    });

    ws.send('Connection established');
});

server.listen(3000, function listening() {
    console.log('Listening on %d', server.address().port);
});
