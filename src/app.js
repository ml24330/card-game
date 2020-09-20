"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var game_1 = require("./game");
var express_1 = __importDefault(require("express"));
var socket_io_1 = __importDefault(require("socket.io"));
var path_1 = __importDefault(require("path"));
var http_1 = __importDefault(require("http"));
var PORT = process.env.PORT || 8000;
var app = express_1.default();
var server = http_1.default.createServer(app);
var io = socket_io_1.default(server, {
    upgradeTimeout: 3000000
});
app.use(express_1.default.static(path_1.default.resolve(__dirname, '../build')));
app.get('*', function (req, res) {
    res.header('cache-control', 'no-cache');
    return res.sendFile(path_1.default.resolve(__dirname, '../build/index.html'));
});
server.listen(PORT, function () {
    console.log("Listening on port " + PORT);
});
var ROOMS = [];
var joinRoom = function (_a) {
    var name = _a.name, role = _a.role, room = _a.room;
    var _room = ROOMS.find(function (_room) { return _room.name === room; });
    // Create room
    if (!_room) {
        ROOMS.push({ name: room, game: undefined, players: [{ name: name, role: role, room: room, isReady: false }], currentPlayers: [{ name: name, role: role, room: room, isReady: false }], playerCount: 1 });
    }
    // Join room
    else {
        var dupeName = !!_room.players.find(function (player) { return player.name === name; });
        if (dupeName) {
            throw Error('DUPE_NAME');
        }
        var isInGame = !!_room.game;
        if (isInGame) {
            throw Error('IN_GAME');
        }
        var isFull = _room.players.length === 4;
        if (isFull) {
            throw Error('FULL');
        }
        var dupeRole = _room.players.filter(function (player) { return player.role === role; }).length > 1;
        if (dupeRole) {
            throw Error('DUPE_ROLE');
        }
        _room.players.push({ name: name, role: role, room: room, isReady: false });
        _room.currentPlayers.push({ name: name, role: role, room: room, isReady: false });
        _room.playerCount++;
    }
};
var findRoom = function (roomName) {
    return ROOMS.find(function (room) { return room.name === roomName; });
};
var toggleReady = function (roomName, playerName) {
    var player = ROOMS.find(function (room) { return room.name === roomName; }).players.find(function (player) { return player.name === playerName; });
    player.isReady = !player.isReady;
};
var removePlayer = function (room, playerName, gameStarted) {
    var _room = findRoom(room.name);
    if (!_room)
        return;
    if (gameStarted) {
        var playerIndex = _room.currentPlayers.findIndex(function (player) { return player.name === playerName; });
        if (playerIndex > -1) {
            _room.currentPlayers.splice(playerIndex, 1);
        }
    }
    else {
        var playerIndex = _room.players.findIndex(function (player) { return player.name === playerName; });
        if (playerIndex > -1) {
            _room.players.splice(playerIndex, 1);
        }
    }
    _room.playerCount--;
};
io.on('connection', function (socket) {
    var time = Date.now();
    console.log('new socket connection');
    var PLAYER = {
        name: undefined,
        role: undefined,
        room: undefined,
        isReady: false
    };
    var ROOM = {
        name: undefined,
        game: undefined,
        players: [],
        currentPlayers: [],
        playerCount: 0
    };
    socket.on('recoverRoom', function (_a) {
        var name = _a.name, roomName = _a.room;
        var roomIsInGame = ROOMS.find(function (room) { return room.name === roomName && room.game; });
        if (roomIsInGame) {
            var game = ROOMS.find(function (room) { return room.name === roomName && room.game; }).game;
            var role = game.players.find(function (player) { return player.name === name; }).role;
            PLAYER.name = name;
            PLAYER.role = role;
            PLAYER.room = roomName;
            socket.join(roomName);
            ROOM = findRoom(PLAYER.room);
            ROOM.currentPlayers.push({ name: name, role: role, room: roomName, isReady: true });
            ROOM.playerCount++;
            console.log(PLAYER.name + " rejoined room " + PLAYER.room);
            socket.emit('roomRecover', { game: game });
            io.in(ROOM.name).emit('dispatch', { game: game, type: 'playerJoin', payload: { name: name } });
        }
    });
    socket.on('setName', function (_a) {
        var name = _a.name, role = _a.role, room = _a.room;
        PLAYER.name = name;
        PLAYER.role = role;
        PLAYER.room = room;
        try {
            joinRoom(PLAYER);
            socket.join(room);
            socket.emit('roomJoin', findRoom(PLAYER.room));
        }
        catch (e) {
            socket.emit('oops', e.message);
            return;
        }
        ROOM = findRoom(PLAYER.room);
        socket.in(room).emit('roomUpdate', ROOM);
    });
    socket.on('toggleReady', function (masterNumber) {
        if (!ROOM.name)
            return;
        toggleReady(ROOM.name, PLAYER.name);
        io.in(ROOM.name).emit('roomUpdate', ROOM);
        var allReady = ROOM.players.filter(function (player) { return player.isReady; }).length === 4;
        if (allReady) {
            var attack_team = ROOM.players.filter(function (player) { return player.role === 'ATTACK'; }).map(function (player) { return player.name; });
            var defend_team = ROOM.players.filter(function (player) { return player.role === 'DEFEND'; }).map(function (player) { return player.name; });
            var _masterNumber = void 0;
            if (masterNumber === 'JOKER') {
                _masterNumber = 'JOKER';
            }
            else {
                _masterNumber = +masterNumber;
            }
            var game_2 = new game_1.Game([attack_team, defend_team], _masterNumber);
            io.in(ROOM.name).emit('gameStart', { game: game_2 });
            socket.emit('gameStart', { game: game_2 });
            setTimeout(function () { io.in(ROOM.name).emit('gameStart', { game: game_2 }); }, 0);
            ROOM.game = game_2;
            setup(game_2, ROOM);
        }
    });
    socket.on('requestDraw', function () {
        if (!ROOM.name)
            return;
        var game = ROOM.game;
        var player = game.currentPlayer;
        game.draw();
        io.in(ROOM.name).emit('dispatch', { game: game, type: 'cardDraw', payload: { player: player } });
    });
    socket.on('requestTake', function (_a) {
        var player = _a.player;
        if (!ROOM.name)
            return;
        var game = ROOM.game;
        game.takeRemaining(player.name);
        io.in(ROOM.name).emit('dispatch', { game: game, type: 'cardTake', payload: { player: player } });
    });
    socket.on('requestSetMasterColor', function (_a) {
        var player = _a.player, card = _a.card;
        if (!ROOM.name)
            return;
        var game = ROOM.game;
        var _card = new game_1.Card(card._value, card._color);
        game.setMasterColor(_card);
        io.in(ROOM.name).emit('dispatch', { game: game, type: 'setMasterColor', payload: { player: player, card: card } });
    });
    socket.on('requestPut', function (_a) {
        var player = _a.player, cards = _a.cards;
        if (!ROOM.name)
            return;
        var game = ROOM.game;
        var _cards = cards.map(function (card) {
            return new game_1.Card(card._value, card._color);
        });
        game.putDownHiddenCards(player.name, _cards);
        io.in(ROOM.name).emit('dispatch', { game: game, type: 'cardPut', payload: { player: player } });
    });
    socket.on('requestPlay', function (_a) {
        var card = _a.card;
        if (!ROOM.name)
            return;
        var game = ROOM.game;
        var _card = new game_1.Card(card._value, card._color);
        try {
            game.play(_card);
        }
        catch (e) {
            console.log(e);
            socket.emit('dispatch', { game: game, type: 'error', payload: { message: e.message } });
        }
    });
    socket.on('noChallenge', function (_a) {
        var playerName = _a.playerName;
        if (!ROOM.name)
            return;
        var game = ROOM.game;
        game.emit('noChallenge', playerName);
    });
    socket.on('challenge', function (_a) {
        var card = _a.card, player = _a.player;
        if (!ROOM.name)
            return;
        var game = ROOM.game;
        var _card = new game_1.Card(card._value, card._color);
        game.emit('challenge', { card: _card, playerName: player.name });
    });
    socket.on('requestPlayBomb', function (_a) {
        var cards = _a.cards;
        if (!ROOM.name)
            return;
        var game = ROOM.game;
        var _cards = [];
        cards.map(function (card) {
            var _card = new game_1.Card(card._value, card._color);
            _card.wasHidden = card.wasHidden;
            _cards.push(_card);
        });
        try {
            game.playBomb(_cards);
        }
        catch (e) {
            console.log(e);
            socket.emit('dispatch', { game: game, type: 'error', payload: { message: e.message } });
        }
    });
    socket.on('requestPlayMultiple', function (_a) {
        var cards = _a.cards;
        if (!ROOM.name)
            return;
        var game = ROOM.game;
        var _cards = cards.map(function (card) {
            return new game_1.Card(card._value, card._color);
        });
        try {
            game.playTopCards(_cards);
        }
        catch (e) {
            console.log(e);
            socket.emit('dispatch', { game: game, type: 'error', payload: { message: e.message } });
        }
    });
    socket.on('requestPlayForBomb', function (_a) {
        var cards = _a.cards;
        if (!ROOM.name)
            return;
        var game = ROOM.game;
        var _cards = cards.map(function (card) {
            return new game_1.Card(card._value, card._color);
        });
        try {
            game.playForBomb(_cards);
        }
        catch (e) {
            console.log(e);
            socket.emit('dispatch', { game: game, type: 'error', payload: { message: e.message } });
        }
    });
    socket.on('requestPlayForMultiple', function (_a) {
        var cards = _a.cards;
        if (!ROOM.name)
            return;
        var game = ROOM.game;
        var _cards = cards.map(function (card) {
            return new game_1.Card(card._value, card._color);
        });
        try {
            game.playForTopCards(_cards);
        }
        catch (e) {
            console.log(e);
            socket.emit('dispatch', { game: game, type: 'error', payload: { message: e.message } });
        }
    });
    socket.on('disconnect', function (reason) {
        if (!ROOM.name)
            return;
        removePlayer(ROOM, PLAYER.name, !!ROOM.game);
        io.in(ROOM.name).emit('roomUpdate', ROOM);
        console.log(socket.id + " disconnect: " + reason + " after " + (Date.now() - time) + " ms. " + (ROOM.name && ROOM.name + " now has " + ROOM.playerCount + " players inside.") + " ");
        if (ROOM.game) {
            io.in(ROOM.name).emit('dispatch', { game: ROOM.game, type: 'playerLeave', payload: { name: PLAYER.name } });
        }
        if (ROOM.playerCount === 0) {
            var roomIndex = ROOMS.findIndex(function (room) { return room.name === ROOM.name; });
            ROOMS.splice(roomIndex, 1);
        }
    });
});
var setup = function (game, context) {
    game.on('phaseChange', function (_a) {
        var phase = _a.phase;
        switch (phase) {
            case 'DRAWING':
                io.in(context.name).emit('dispatch', { game: context.game, type: 'drawPhase', payload: {} });
                break;
            case 'TAKING':
                io.in(context.name).emit('dispatch', { game: context.game, type: 'takePhase', payload: {} });
                break;
            case 'PUTTING':
                io.in(context.name).emit('dispatch', { game: context.game, type: 'putPhase', payload: {} });
                break;
            case 'PLAYING':
                io.in(context.name).emit('dispatch', { game: context.game, type: 'playPhase', payload: {} });
                break;
        }
    });
    game.on('roundend', function (_a) {
        var winner = _a.winner, discardedCards = _a.discardedCards, takenCards = _a.takenCards;
        io.in(context.name).emit('dispatch', { game: context.game, type: 'roundEnd', payload: { winner: winner, discardedCards: discardedCards, takenCards: takenCards } });
    });
    game.on('end', function (_a) {
        var score = _a.score, flipCards = _a.flipCards;
        io.in(context.name).emit('dispatch', { game: context.game, type: 'gameEnd', payload: { score: score, flipCards: flipCards } });
        ROOMS.splice(ROOMS.findIndex(function (room) { return room.name === context.name; }), 1);
    });
    game.on('cardplay', function (_a) {
        var player = _a.player, card = _a.card;
        io.in(context.name).emit('dispatch', { game: context.game, type: 'cardPlay', payload: { player: player, card: card } });
    });
    game.on('strongBomb', function (_a) {
        var cards = _a.cards, player = _a.player;
        io.in(context.name).emit('dispatch', { game: context.game, type: 'strongBomb', payload: { player: player, cards: cards } });
    });
    game.on('weakBomb', function (_a) {
        var cards = _a.cards, player = _a.player;
        io.in(context.name).emit('dispatch', { game: context.game, type: 'weakBomb', payload: { player: player, cards: cards } });
    });
    game.on('requestChallenge', function (_a) {
        var cards = _a.cards, player = _a.player;
        io.in(context.name).emit('dispatch', { game: context.game, type: 'requestChallenge', payload: { player: player, cards: cards } });
    });
    game.on('multipleCardplay', function (_a) {
        var cards = _a.cards, player = _a.player;
        io.in(context.name).emit('dispatch', { game: context.game, type: 'multipleCardPlay', payload: { player: player, cards: cards } });
    });
    game.on('failedChallenge', function (playerName) {
        io.in(context.name).emit('dispatch', { game: context.game, type: 'challengeFailed', payload: { playerName: playerName } });
    });
    game.on('successfulChallenge', function (_a) {
        var card = _a.card, playerName = _a.playerName;
        io.in(context.name).emit('dispatch', { game: context.game, type: 'challengeSuccess', payload: { card: card, playerName: playerName } });
    });
    game.on('forMultipleCardplay', function (_a) {
        var player = _a.player, cards = _a.cards;
        io.in(context.name).emit('dispatch', { game: context.game, type: 'forMultipleCardPlay', payload: { player: player, cards: cards } });
    });
    game.on('forBombCardplay', function (_a) {
        var player = _a.player, cards = _a.cards;
        io.in(context.name).emit('dispatch', { game: context.game, type: 'forBombCardPlay', payload: { player: player, cards: cards } });
    });
    game.start();
};
