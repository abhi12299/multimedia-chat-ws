const express = require('express');
const Busboy = require('busboy');
const path = require('path');
const fs = require('fs');

var app = express();
app.use(express.static(path.join(__dirname, 'uploads')));

var http = require('http').createServer(app);
var io = require('socket.io')(http);

app.get('/', function(req, res){
    res.sendFile(__dirname + '/index.html');
});

app.post('/upload', function(req, res) {
    const busboy = new Busboy({ headers: req.headers });
    req.pipe(busboy);
    busboy.on('file', (fieldname, file, filename) => {
        const ext = path.extname(filename);
        const newFilename = `${Date.now()}${ext}`;
        req.newFilename = newFilename;
        req.originalFilename = filename;
        const saveTo = path.join('uploads', newFilename);
        file.pipe(fs.createWriteStream(saveTo));
    });
    busboy.on('finish', () => {
        res.json({
            originalFilename: req.originalFilename,
            newFilename: req.newFilename
        });
    });
});

io.on('connection', function(socket){
    socket.on('name', d => {
        socket.name = d.name;
        io.emit('join', { name: d.name });
    });

    socket.on('disconnect', () => {
        console.log('Socket disconnected!');
        io.emit('leave', { name: socket.name });
    });

    socket.on('pre-type', d => {
        socket.broadcast.emit('pre-type', d);
    });

    socket.on('start-type', d => {
        socket.broadcast.emit('start-type', d);
    });

    socket.on('stop-type', d => {
        socket.broadcast.emit('stop-type', d);
    });

    socket.on('chat', d => {
        io.emit('chat', d);
    });

    socket.on('audio', d => {
        io.emit('audio', d);
    });
    
    socket.on('video', d => {
        io.emit('video', d);
    });
});

http.listen(3000, function(){
  console.log('listening on *:3000');
});