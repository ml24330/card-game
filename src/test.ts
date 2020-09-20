import express from 'express';
import socketio from 'socket.io';
import http from 'http';

const PORT = process.env.PORT || 8000;

const app = express();
const server = http.createServer(app);
const io = socketio(server);

server.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`);
});

const checkLength = (bar) => {
    if(bar.length > 14){
        throw Error('word is too long!');
    }
    // ...
}

io.on('connection', socket => {
    console.log('new socket connection');

    socket.on('foo', ({bar}) => {
        try{
            checkLength(bar);
        }catch(e){
            socket.emit('error1', e.message);
            return;
        }
        console.log('app did not crash!');
    })
}