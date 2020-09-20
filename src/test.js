"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = __importDefault(require("express"));
var socket_io_1 = __importDefault(require("socket.io"));
var http_1 = __importDefault(require("http"));
var PORT = process.env.PORT || 8000;
var app = express_1.default();
var server = http_1.default.createServer(app);
var io = socket_io_1.default(server);
server.listen(PORT, function () {
    console.log("Listening on port " + PORT);
});
var checkLength = function (bar) {
    if (bar.length > 14) {
        throw Error('word is too long!');
    }
    // ...
};
io.on('connection', function (socket) {
    console.log('new socket connection');
    socket.on('foo', function (_a) {
        var bar = _a.bar;
        try {
            checkLength(bar);
        }
        catch (e) {
            socket.emit('error1', e.message);
            return;
        }
        console.log('app did not crash!');
    });
});
