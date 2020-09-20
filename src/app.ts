import { Game, Card } from './game';
import express from 'express';
import socketio from 'socket.io';
import path from 'path';
import http from 'http';

const PORT = process.env.PORT || 8000;

const app = express();
const server = http.createServer(app);
const io = socketio(server, {
    upgradeTimeout: 3000000   
});

app.use(express.static(path.resolve(__dirname, '../build')));

app.get('*', (req, res) => {
    res.header('cache-control', 'no-cache');
    return res.sendFile(path.resolve(__dirname, '../build/index.html'));
});

server.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`);
})


// Game logic

interface Player {
    name: string | undefined,
    role: 'ATTACK' | 'DEFEND' | undefined,
    room: string | undefined,
    isReady: boolean
}

interface Room {
    name: string | undefined,
    game: Game | undefined,
    players: Player[],
    currentPlayers: Player[],
    playerCount: number
}

const ROOMS: Room[] = [];

const joinRoom = ({name, role, room}: Player) => {
    let _room: Room | undefined = ROOMS.find(_room => _room.name === room);
    // Create room
    if(!_room){
        ROOMS.push({name: room, game: undefined, players: [{name, role, room, isReady: false}], currentPlayers: [{name, role, room, isReady: false}], playerCount: 1})
    }
    // Join room
    else{
        let dupeName: boolean = !!_room.players.find(player => player.name === name);
        if(dupeName){
            throw Error('DUPE_NAME');
        }

        let isInGame: boolean = !!_room.game;
        if(isInGame){
            throw Error('IN_GAME');
        }

        let isFull: boolean = _room.players.length === 4;
        if(isFull){
            throw Error('FULL');
        }

        let dupeRole: boolean = _room.players.filter(player => player.role === role).length > 1;
        if(dupeRole){
            throw Error('DUPE_ROLE');
        }
        _room.players.push({name, role, room, isReady: false});
        _room.currentPlayers.push({name, role, room, isReady: false});
        _room.playerCount++;
    }
}

const findRoom = (roomName: string): Room => {
    return ROOMS.find(room => room.name === roomName) as Room;
}

const toggleReady = (roomName: string, playerName: string) => {
    let player = ROOMS.find(room => room.name === roomName)!.players.find(player => player.name === playerName)!;
    player.isReady = !player.isReady; 
}

const removePlayer = (room: Room, playerName: string, gameStarted: boolean) => {
    let _room = findRoom(room.name!);
    if(!_room) return;
    if(gameStarted){
        let playerIndex = _room.currentPlayers.findIndex(player => player.name === playerName);
        if(playerIndex > -1){_room.currentPlayers.splice(playerIndex, 1)}
    }else{
        let playerIndex = _room.players.findIndex(player => player.name === playerName);
        if(playerIndex > -1){_room.players.splice(playerIndex, 1)}
    }
    _room.playerCount--;
}

io.on('connection', socket => {
    let time = Date.now();
    console.log('new socket connection');

    let PLAYER: Player = {
        name: undefined,
        role: undefined,
        room: undefined,
        isReady: false
    };

    let ROOM: Room  = {
        name: undefined,
        game: undefined,
        players: [],
        currentPlayers: [],
        playerCount: 0
    }

    socket.on('recoverRoom', ({name, room: roomName}: {name: string, room: string}) => {
        let roomIsInGame = ROOMS.find(room => room.name === roomName && room.game);
        if(roomIsInGame){
            let game = ROOMS.find(room => room.name === roomName && room.game)!.game!;
            let role = game.players.find(player => player.name === name)!.role;
            PLAYER.name = name;
            PLAYER.role = role;
            PLAYER.room = roomName;

            socket.join(roomName);

            ROOM = findRoom(PLAYER.room);
            ROOM.currentPlayers.push({name, role, room: roomName, isReady: true});
            ROOM.playerCount++;

            console.log(`${PLAYER.name} rejoined room ${PLAYER.room}`);

            socket.emit('roomRecover', {game});
            io.in(ROOM.name!).emit('dispatch', {game, type: 'playerJoin', payload: {name}});
        }
    });

    socket.on('setName', ({name, role, room}: {name: string, role: 'ATTACK' | 'DEFEND', room: string}): void => {

        PLAYER.name = name;
        PLAYER.role = role;
        PLAYER.room = room;

        try{
            joinRoom(PLAYER);
            socket.join(room);
            socket.emit('roomJoin', findRoom(PLAYER.room));
        }catch(e){
            socket.emit('oops', e.message);
            return;
        }

        ROOM = findRoom(PLAYER.room);
        socket.in(room).emit('roomUpdate', ROOM);
    });

    socket.on('toggleReady', (masterNumber: string) => {
        if(!ROOM.name) return;
        toggleReady(ROOM.name!, PLAYER.name!);
        io.in(ROOM.name!).emit('roomUpdate', ROOM);

        let allReady: boolean = ROOM.players.filter(player => player.isReady).length === 4;

        if(allReady){
            let attack_team = ROOM.players.filter(player => player.role === 'ATTACK').map(player => player.name);
            let defend_team = ROOM.players.filter(player => player.role === 'DEFEND').map(player => player.name);
            
            let _masterNumber: any;

            if(masterNumber === 'JOKER'){
                _masterNumber = 'JOKER';
            }else{
                _masterNumber = +masterNumber;
            }

            const game = new Game([attack_team as [string, string], defend_team as [string, string]], _masterNumber);

            io.in(ROOM.name!).emit('gameStart', {game});
            socket.emit('gameStart', {game});
            setTimeout(() => {io.in(ROOM.name!).emit('gameStart', {game})}, 0);

            ROOM.game = game;
            setup(game, ROOM);
        }
    })

    socket.on('requestDraw', () => {
        if(!ROOM.name) return;
        let game = ROOM.game!;
        let player = game.currentPlayer;
        game.draw();
        io.in(ROOM.name!).emit('dispatch', { game, type: 'cardDraw', payload: { player } });
    });

    socket.on('requestTake', ({player}) => {
        if(!ROOM.name) return;
        let game = ROOM.game!;
        game.takeRemaining(player!.name);
        io.in(ROOM.name!).emit('dispatch', { game, type: 'cardTake', payload: { player } });
    });

    socket.on('requestSetMasterColor', ({player, card}) => {
        if(!ROOM.name) return;
        let game = ROOM.game!;
        let _card = new Card(card._value, card._color);
        game.setMasterColor(_card);
        io.in(ROOM.name!).emit('dispatch', { game, type: 'setMasterColor', payload: { player, card } })
    });

    socket.on('requestPut', ({player, cards}) => {
        if(!ROOM.name) return;
        let game = ROOM.game!;
        let _cards = cards.map((card: any) => {
            return new Card(card._value, card._color);
        });
        game.putDownHiddenCards(player.name, _cards);
        io.in(ROOM.name!).emit('dispatch', { game, type: 'cardPut', payload: { player }});
    });

    socket.on('requestPlay', ({card}) => {
        if(!ROOM.name) return;
        let game = ROOM.game!;
        let _card = new Card(card._value, card._color);
        try{
            game.play(_card);
        }catch(e){
            console.log(e);
            socket.emit('dispatch', { game, type: 'error', payload: { message: e.message } });
        }
    });

    socket.on('noChallenge', ({playerName}) => {
        if(!ROOM.name) return;
        let game = ROOM.game!;
        game.emit('noChallenge', playerName);
    });

    socket.on('challenge', ({card, player}) => {
        if(!ROOM.name) return;
        let game = ROOM.game!;
        let _card = new Card(card._value, card._color);
        game.emit('challenge', {card: _card, playerName: player.name});
    });

    socket.on('requestPlayBomb', ({cards}: {cards: {[keys: string]: any}[]}) => {
        if(!ROOM.name) return;
        let game = ROOM.game!;
        let _cards: Card[] = [];
        cards.map(card => {
            let _card = new Card(card._value, card._color);
            _card.wasHidden = card.wasHidden;
            _cards.push(_card);
        });
        try{
            game.playBomb(_cards as [Card, Card, Card, Card]);
        }catch(e){
            console.log(e);
            socket.emit('dispatch', { game, type: 'error', payload: { message: e.message } });
        }
    });

    socket.on('requestPlayMultiple', ({cards}: {cards: {[keys: string]: any}[]}) => {
        if(!ROOM.name) return;
        let game = ROOM.game!;
        let _cards = cards.map(card => {
            return new Card(card._value, card._color);
        });
        try{
            game.playTopCards(_cards);
        }catch(e){
            console.log(e);
            socket.emit('dispatch', { game, type: 'error', payload: { message: e.message } });
        }
    });

    socket.on('requestPlayForBomb', ({cards}: {cards: {[keys: string]: any}[]}) => {
        if(!ROOM.name) return;
        let game = ROOM.game!;
        let _cards = cards.map(card => {
            return new Card(card._value, card._color);
        });
        try{
            game.playForBomb(_cards);
        }catch(e){
            console.log(e);
            socket.emit('dispatch', { game, type: 'error', payload: { message: e.message } });
        }
    });

    socket.on('requestPlayForMultiple', ({cards}: {cards: {[keys: string]: any}[]}) => {
        if(!ROOM.name) return;
        let game = ROOM.game!;
        let _cards = cards.map(card => {
            return new Card(card._value, card._color);
        });
        try{
            game.playForTopCards(_cards);
        }catch(e){
            console.log(e);
            socket.emit('dispatch', { game, type: 'error', payload: { message: e.message } });
        }
    });

    socket.on('disconnect', reason => {
        if(!ROOM.name) return;
        removePlayer(ROOM, PLAYER.name!, !!ROOM.game);
        io.in(ROOM.name!).emit('roomUpdate', ROOM);
        console.log(`${socket.id} disconnect: ${reason} after ${Date.now() - time} ms. ${ROOM.name && `${ROOM.name} now has ${ROOM.playerCount} players inside.`} `);
        if(ROOM.game){
            io.in(ROOM.name!).emit('dispatch', { game: ROOM.game, type: 'playerLeave', payload: { name: PLAYER.name } });
        }
        if(ROOM.playerCount === 0){
            let roomIndex = ROOMS.findIndex(room => room.name === ROOM.name);
            ROOMS.splice(roomIndex, 1);
        }
    })
})

const setup = (game: Game, context: Room) => {
    game.on('phaseChange', ({phase}) => {
        switch(phase){
            case 'DRAWING':
                io.in(context.name!).emit('dispatch', { game: context.game, type: 'drawPhase', payload: {}});
                break;
            case 'TAKING':
                io.in(context.name!).emit('dispatch', { game: context.game, type: 'takePhase', payload: {} });
                break;
            case 'PUTTING':
                io.in(context.name!).emit('dispatch', { game: context.game, type: 'putPhase', payload: {} });
                break;
            case 'PLAYING':
                io.in(context.name!).emit('dispatch', { game: context.game, type: 'playPhase', payload: {} });
                break;
        }
    });
    game.on('roundend', ({winner, discardedCards, takenCards}) => {
        io.in(context.name!).emit('dispatch', { game: context.game, type: 'roundEnd', payload: { winner, discardedCards, takenCards }});
    });
    game.on('end', ({score, flipCards}) => {
        io.in(context.name!).emit('dispatch', { game: context.game, type: 'gameEnd', payload: { score, flipCards } });
        ROOMS.splice(ROOMS.findIndex(room => room.name === context.name), 1);
    });
    game.on('cardplay', ({player, card}) => {
        io.in(context.name!).emit('dispatch', { game: context.game, type: 'cardPlay', payload: { player, card } });
    });
    game.on('strongBomb', ({cards, player}) => {
        io.in(context.name!).emit('dispatch', { game: context.game, type: 'strongBomb', payload: { player, cards }});
    });
    game.on('weakBomb', ({cards, player}) => {
        io.in(context.name!).emit('dispatch', { game: context.game, type: 'weakBomb', payload: { player, cards } });
    });
    game.on('requestChallenge', ({cards, player}) => {
        io.in(context.name!).emit('dispatch', { game: context.game, type: 'requestChallenge', payload: { player, cards } });
    })
    game.on('multipleCardplay', ({cards, player}) => {
        io.in(context.name!).emit('dispatch', { game: context.game, type: 'multipleCardPlay', payload: { player, cards } });
    });
    game.on('failedChallenge', (playerName) => {
        io.in(context.name!).emit('dispatch', { game: context.game, type: 'challengeFailed', payload: { playerName } });
    });
    game.on('successfulChallenge', ({card, playerName}) => {
        io.in(context.name!).emit('dispatch', { game: context.game, type: 'challengeSuccess', payload: { card, playerName } });
    });
    game.on('forMultipleCardplay', ({player, cards}) => {
        io.in(context.name!).emit('dispatch', { game: context.game, type: 'forMultipleCardPlay', payload: { player, cards } });
    });
    game.on('forBombCardplay', ({player, cards}) => {
        io.in(context.name!).emit('dispatch', { game: context.game, type: 'forBombCardPlay', payload: { player, cards } });
    });
    game.start();
}