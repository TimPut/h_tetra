const fs = require('fs');
const http = require('http');
const WebSocket = require('ws');
const express = require('express');
const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ port: 8080 });
const path = require('path');

app.use(express.static(path.join(__dirname, 'public')));

wss.on('connection', ws => {
    // fs.readFile('./3DBenchy.stl', (err, data) => {
    fs.readFile('./Voron_Design_Cube_v7.stl', (err, data) => {
        if (err) throw err;
        ws.send(data);
    });
});

server.listen(3000, function listening() {
    console.log('Listening on %d', server.address().port);
});
