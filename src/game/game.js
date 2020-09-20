"use strict";
// Start the game here
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Game = void 0;
var events_1 = require("events");
var card_1 = require("./card");
var player_js_1 = require("./player.js");
var deck_js_1 = require("./deck.js");
var team_js_1 = require("./team.js");
var Game = /** @class */ (function (_super) {
    __extends(Game, _super);
    // p1 and p2 ATTACKS; p3 and p4 DEFENDS
    function Game(_a, masterNumber) {
        var _b = _a[0], p1 = _b[0], p2 = _b[1], _c = _a[1], p3 = _c[0], p4 = _c[1];
        var _this = _super.call(this) || this;
        _this._players = [];
        _this._currentRoundCards = [];
        _this._currentRoundTopCards = [];
        _this.currentRoundCount = 0;
        _this.roundCount = 0;
        _this.masterNumber = masterNumber;
        _this._discardedPile = [];
        if (!p1 || !p2 || !p3 || !p4) {
            throw Error('The game must be started with four players, with two on each team!');
        }
        var player_1 = new player_js_1.Player(p1, 'ATTACK');
        var player_2 = new player_js_1.Player(p2, 'ATTACK');
        var player_3 = new player_js_1.Player(p3, 'DEFEND');
        var player_4 = new player_js_1.Player(p4, 'DEFEND');
        _this._teams = [new team_js_1.Team([player_1, player_2], 'ATTACK'), new team_js_1.Team([player_3, player_4], 'DEFEND')];
        _this._players = [player_1, player_3, player_2, player_4];
        return _this;
    }
    Game.prototype.start = function () {
        // Init draw pile
        this.drawPile = new deck_js_1.Deck();
        // Select starting player
        this._currentPlayer = this.players[Math.floor(Math.random() * 4)];
        // Set game phase to drawing
        this.phase = 'DRAWING';
        this.emit('phaseChange', { phase: this.phase });
        // Skip drawing if master number is joker
        if (this.masterNumber === 'JOKER') {
            this.masterColor = card_1.Colors.JOKER;
            while (this.drawPile.length > 6) {
                this.draw();
            }
        }
    };
    Game.prototype.draw = function () {
        var _this = this;
        // Check if phase is drawing
        if (!(this.phase === 'DRAWING')) {
            throw Error('You cannot draw cards at this point!');
        }
        // Draw card for current player
        var card_drawn = this.drawPile.draw();
        this._currentPlayer.hand = this._currentPlayer.hand.concat([card_drawn]);
        this.masterColor ? this._currentPlayer.sortHand(this.masterNumber, this.masterColor) : this._currentPlayer.sortHand(this.masterNumber);
        // Emit draw event
        this.emit('draw', { player: this._currentPlayer.name, card: card_drawn });
        // Check if six cards will remain
        if (this.drawPile.length === 6) {
            // Check if master color is still to be decided
            if (!this.masterColor) {
                var colors_array = this.drawPile.cards.map(function (card) { return card.color; });
                this.masterColor = +this.findMostDuplicates(colors_array);
            }
            this.players.forEach(function (player) { return player.sortHand(_this.masterNumber, _this.masterColor); });
            this._hiddenCards = this.drawPile.cards;
            this.phase = 'TAKING';
            // Emit event
            this.emit('phaseChange', { phase: this.phase });
        }
        // Move to next player
        this._currentPlayer = this.nextPlayer;
    };
    Game.prototype.setMasterColor = function (card) {
        // Check if phase is drawing
        if (!(this.phase === 'DRAWING')) {
            throw Error('Master color can only be set while drawing!');
        }
        // Check if card is a master card
        if (!(card.value === this.masterNumber)) {
            throw Error('You cannot declare a master color with the card!');
        }
        this.masterColor = card.color;
        // Distribute remaining cards
        while (this.drawPile.length > 6) {
            this.draw();
        }
    };
    Game.prototype.takeRemaining = function (playerName) {
        // Check if phase is taking
        if (!(this.phase === 'TAKING')) {
            throw Error('You cannot take remaining cards at this point!');
        }
        // Find player and give card
        var player = this.getPlayerByName(playerName);
        if (!player) {
            throw Error('This player does not exist!');
        }
        if (!(this.getPlayerTeam(player).role === 'DEFEND')) {
            throw Error('Only the defending team can take remaining cards!');
        }
        var cardsTaken = this.drawPile.takeRemaining();
        player.hand = player.hand.concat(cardsTaken);
        player.sortHand(this.masterNumber, this.masterColor);
        this.emit('cardtake', { player: player.name, cards: cardsTaken });
        this.phase = 'PUTTING';
        this.emit('phaseChange', { phase: this.phase });
    };
    Game.prototype.putDownHiddenCards = function (playerName, cardsToBePutDown) {
        var _this = this;
        // Check if phase is putting
        if (!(this.phase === 'PUTTING')) {
            throw Error('You cannot put down hidden cards at this point!');
        }
        // Check if six cards are being put down
        if (!(cardsToBePutDown.length === 6)) {
            throw Error('You must put down six cards!');
        }
        // Check if cards carry more than 25 points
        var totalPoints = cardsToBePutDown.reduce(function (accumulator, current) {
            return accumulator + current.pointsHeld();
        }, 0);
        if (totalPoints > 25) {
            throw Error('You can only put cards carrying a maximum of 25 points down!');
        }
        // Find player
        var player = this.getPlayerByName(playerName);
        if (!player) {
            throw Error('This player does not exist!');
        }
        cardsToBePutDown.forEach(function (card) {
            if (!player.hasCard) {
                throw Error("Cannot find card " + card.value + " " + card.color + " on player " + player.name + "!");
            }
        });
        cardsToBePutDown.forEach(function (card) {
            player.removeCard(card);
        });
        this._hiddenCards = cardsToBePutDown;
        this.emit('cardput', { player: playerName, cards: cardsToBePutDown });
        this.phase = 'PLAYING';
        this.players.forEach(function (player) { return player.sortHand(_this.masterNumber, _this.masterColor); });
        this.emit('phaseChange', { phase: this.phase });
        var currentPlayer = this.getPlayerTeam(player).players.find(function (player) { return player.name === playerName; });
        this.initRound(currentPlayer);
    };
    Game.prototype.play = function (cardToBePlayed) {
        var _this = this;
        // Throw error if four players have already played
        if (this._currentRoundCards.length > 3) {
            throw Error('Players can only play once every round!');
        }
        // Throw error if player does not have card
        if (!this._currentPlayer.hasCard(cardToBePlayed)) {
            throw Error("Current player " + this._currentPlayer.name + " does not have card " + cardToBePlayed.toString() + " at hand!");
        }
        var currentPlayer = this._currentPlayer;
        // Throw error if player has matching cards but did not play
        if (this._currentRoundCards.length > 0) {
            if (cardToBePlayed.isMaster(this.masterColor, this.masterNumber) && !this._currentRoundCards[0].card.isMaster(this.masterColor, this.masterNumber)) {
                var has_matching = !!this._currentPlayer.hand.find(function (card) { return (card.color === _this._currentRoundCards[0].card.color && !card.isMaster(_this.masterColor, _this.masterNumber)); });
                if (has_matching) {
                    throw Error("You cannot play card " + cardToBePlayed.toString() + " because you have other matching cards!");
                }
            }
            if (!(cardToBePlayed.color === this._currentRoundCards[0].card.color) && !(cardToBePlayed.isMaster(this.masterColor, this.masterNumber) && this._currentRoundCards[0].card.isMaster(this.masterColor, this.masterNumber))) {
                var has_matching = void 0;
                if (!this._currentRoundCards[0].card.isMaster(this.masterColor, this.masterNumber)) {
                    has_matching = !(this._currentPlayer.hand.filter(function (card) {
                        if (!card.isMaster(_this.masterColor, _this.masterNumber)) {
                            return card.color === _this._currentRoundCards[0].card.color;
                        }
                    }).length === 0);
                }
                else if (this._currentRoundCards[0].card.isMaster(this.masterColor, this.masterNumber)) {
                    has_matching = !(this._currentPlayer.hand.filter(function (card) {
                        return card.isMaster(_this.masterColor, _this.masterNumber);
                    }).length === 0);
                }
                if (has_matching) {
                    throw Error("You cannot play card " + cardToBePlayed.toString() + " because you have other matching cards!");
                }
            }
        }
        var cardToBePushed = {
            card: cardToBePlayed,
            playedBy: this._currentPlayer
        };
        this._currentRoundCards.push(cardToBePushed);
        this._currentPlayer.removeCard(cardToBePlayed);
        this.currentRoundCount++;
        // Check if everyone has played
        if (this.currentRoundCount === 4) {
            this.cleanRound();
        }
        else {
            this._currentPlayer = this.nextPlayer;
        }
        // Emit event
        this.emit('cardplay', { player: currentPlayer, card: cardToBePushed });
    };
    Game.prototype.playTopCards = function (cards) {
        var _this = this;
        if (cards.length < 2) {
            throw Error('You are not playing two or more cards! Use the regular `play` method instead.');
        }
        cards.forEach(function (card) {
            if (cards[0].isMaster(_this.masterColor, _this.masterNumber)) {
                if (!card.isMaster(_this.masterColor, _this.masterNumber)) {
                    throw Error('Cannot play cards because they do not have the same color!');
                }
            }
            else {
                if (card.color !== cards[0].color) {
                    throw Error('Cannot play cards because they do not have the same color!');
                }
            }
        });
        var smallestCard = cards.reduce(function (previous, current) {
            if (cards[0].isMaster(_this.masterColor, _this.masterNumber)) {
                if (previous.value === _this.masterNumber && current.value === _this.masterNumber && current.color === _this.masterColor) {
                    return previous;
                }
                else if (previous.value === _this.masterNumber && current.value < card_1.Values.SMALL_JOKER) {
                    return current;
                }
                else if (current.value < previous.value) {
                    return current;
                }
                else {
                    return previous;
                }
            }
            else if (current.value < previous.value) {
                return current;
            }
            else {
                return previous;
            }
        }, cards[0]);
        // Check if anyone challenges
        var waitForChallenge = function () { return __awaiter(_this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                this.emit('requestChallenge', { cards: cards, player: this._currentPlayer });
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        var respondedPlayers = new Set();
                        _this.on('noChallenge', function (playerName) {
                            respondedPlayers.add(playerName);
                            _this.emit('failedChallenge', playerName);
                            if (respondedPlayers.size === 3) {
                                resolve();
                            }
                        });
                        _this.on('challenge', function (_a) {
                            var card = _a.card, playerName = _a.playerName;
                            var isMaster = cards[0].isMaster(_this.masterColor, _this.masterNumber);
                            if (isMaster) {
                                if ((card.value === _this.masterNumber && !(smallestCard.value === _this.masterNumber) && smallestCard.value < 14) || (card.value === _this.masterNumber && card.color === _this.masterColor && smallestCard.value < card_1.Values.SMALL_JOKER)) {
                                    _this.emit('successfulChallenge', { card: card, playerName: playerName });
                                    reject();
                                }
                                else if (card.isMaster(_this.masterColor, _this.masterNumber) && card.value > smallestCard.value) {
                                    _this.emit('successfulChallenge', { card: card, playerName: playerName });
                                    reject();
                                }
                                else {
                                    respondedPlayers.add(playerName);
                                    _this.emit('failedChallenge', playerName);
                                    if (respondedPlayers.size === 3) {
                                        resolve();
                                    }
                                }
                            }
                            else {
                                if (card.color === smallestCard.color && card.value > smallestCard.value) {
                                    _this.emit('successfulChallenge', { card: card, playerName: playerName });
                                    reject();
                                }
                                else {
                                    respondedPlayers.add(playerName);
                                    _this.emit('failedChallenge', playerName);
                                    if (respondedPlayers.size === 3) {
                                        resolve();
                                    }
                                }
                            }
                        });
                    })];
            });
        }); };
        var cardsToBePushed = [];
        waitForChallenge()
            .then(function () {
            cards.forEach(function (card) {
                cardsToBePushed.push({
                    card: card,
                    playedBy: _this._currentPlayer
                });
                _this._currentRoundTopCards.push(card);
                _this._currentPlayer.removeCard(card);
            });
            _this._currentRoundCards = _this._currentRoundCards.concat(cardsToBePushed);
            var currentPlayer = _this._currentPlayer;
            _this.currentRoundCount++;
            _this._currentPlayer = _this.nextPlayer;
            _this.emit('multipleCardplay', { cards: cardsToBePushed, player: currentPlayer });
        })
            .catch(function () {
            _this.play(smallestCard);
        })
            .finally(function () {
            _this.removeAllListeners('challenge');
            _this.removeAllListeners('noChallenge');
        });
    };
    Game.prototype.playForTopCards = function (cards) {
        var _this = this;
        cards.forEach(function (card) {
            if (!_this._currentPlayer.hasCard(card)) {
                throw Error("The current player does not have card " + card.toString() + " at hand!");
            }
        });
        if (!(cards.length === this._currentRoundTopCards.length)) {
            throw Error("Expected " + this._currentRoundTopCards.length + " cards, but received " + cards.length + "!");
        }
        var isMaster = this._currentRoundTopCards[0].isMaster(this.masterColor, this.masterNumber);
        if (isMaster) {
            var playedMasterCardCount = cards.filter(function (card) { return card.isMaster(_this.masterColor, _this.masterNumber); }).length;
            var masterCardCount = this._currentPlayer.hand.filter(function (card) { return card.isMaster(_this.masterColor, _this.masterNumber); }).length;
            if (playedMasterCardCount < this._currentRoundTopCards.length && playedMasterCardCount < masterCardCount) {
                throw Error('You must play your remaining master cards!');
            }
        }
        else {
            var matchingColor_1 = this._currentRoundTopCards[0].color;
            var playedMatchingColorCardCount = cards.filter(function (card) { return (card.color === matchingColor_1 && !card.isMaster(_this.masterColor, _this.masterNumber)); }).length;
            var matchingColorCardCount = this._currentPlayer.hand.filter(function (card) { return (card.color === matchingColor_1 && !card.isMaster(_this.masterColor, _this.masterNumber)); }).length;
            if (playedMatchingColorCardCount < this._currentRoundTopCards.length && playedMatchingColorCardCount < matchingColorCardCount) {
                throw Error("You must play your remaining cards that matches the color " + card_1.Colors[matchingColor_1] + "!");
            }
        }
        var currentPlayer = this._currentPlayer;
        var cardsToBePushed = [];
        cards.forEach(function (card) {
            cardsToBePushed.push({
                card: card,
                playedBy: _this._currentPlayer
            });
            _this._currentPlayer.removeCard(card);
        });
        this._currentRoundCards = this._currentRoundCards.concat(cardsToBePushed);
        this.currentRoundCount++;
        if (this.currentRoundCount === 4) {
            this.cleanTopCardsRound();
        }
        else {
            this._currentPlayer = this.nextPlayer;
        }
        this.emit('forMultipleCardplay', { player: currentPlayer, cards: cardsToBePushed });
    };
    Game.prototype.cleanTopCardsRound = function () {
        var _this = this;
        if (!(this.currentRoundCount === 4)) {
            throw Error('Not everyone has played four cards yet!');
        }
        var cardsToAdd = [];
        var player = this._currentRoundCards[0].playedBy;
        // Find if someone played only master cards
        var cardsPerPlayer = this._currentRoundCards.length / 4;
        var cardsByPlayer = [];
        for (var i = 0; i < this._currentRoundCards.length; i += cardsPerPlayer) {
            cardsByPlayer.push(this._currentRoundCards.slice(i, i + cardsPerPlayer));
        }
        var allMasterArray = [];
        if (!cardsByPlayer[0][0].card.isMaster(this.masterColor, this.masterNumber)) {
            for (var i = 1; i < 4; i++) {
                var allMaster = !cardsByPlayer[i].find(function (card) { return !card.card.isMaster(_this.masterColor, _this.masterNumber); });
                if (allMaster) {
                    allMasterArray.push(cardsByPlayer[i]);
                }
            }
        }
        var roundWinningTeam;
        var roundWinningPlayer;
        // Check if multiple players played only master cards
        if (allMasterArray.length > 1) {
            // Select the player with the largest master card
            var largestCardArray_1 = [];
            allMasterArray.forEach(function (masterArray) {
                var largestCard = masterArray.reduce(function (previous, current) {
                    if (current.card.value > previous.card.value) {
                        return current;
                    }
                    else {
                        return previous;
                    }
                }, masterArray[0]);
                largestCardArray_1.push(largestCard);
            });
            largestCardArray_1.sort().reverse();
            roundWinningPlayer = largestCardArray_1[0].playedBy;
        }
        else if (allMasterArray.length === 1) {
            roundWinningPlayer = allMasterArray[0][0].playedBy;
        }
        else if (allMasterArray.length === 0) {
            roundWinningPlayer = cardsByPlayer[0][0].playedBy;
        }
        roundWinningTeam = this.teams.find(function (team) { return team.role === roundWinningPlayer.role; });
        if (roundWinningTeam.role === 'ATTACK') {
            cardsToAdd = this._currentRoundCards.filter(function (playedCard) { return playedCard.card.isSpecial(); }).map(function (playedCard) {
                return {
                    card: playedCard.card,
                    points: playedCard.card.pointsHeld()
                };
            });
            this._currentRoundCards = this._currentRoundCards.filter(function (playedCard) { return !playedCard.card.isSpecial(); });
        }
        roundWinningTeam.ownedCards = roundWinningTeam.ownedCards.concat(cardsToAdd);
        setTimeout(function () { return _this.emit('roundend', { winner: roundWinningTeam, discardedCards: discardedCards, takenCards: cardsToAdd }); }, 0);
        var discardedCards = this._currentRoundCards;
        this._discardedPile = this._discardedPile.concat(discardedCards);
        this._currentRoundCards = [];
        this._currentRoundTopCards = [];
        this.currentRoundCount = 0;
        this.roundCount += cardsPerPlayer;
        if (this.roundCount === 12) {
            var score_1 = this.calculateScore(roundWinningTeam.role === 'ATTACK');
            // Emit event
            setTimeout(function () { return _this.emit('end', { score: score_1, flipCards: roundWinningTeam.role === 'ATTACK' }); }, 0);
        }
        else {
            // Init new round
            this.initRound(roundWinningPlayer);
        }
    };
    Game.prototype.playBomb = function (cards) {
        var _this = this;
        cards.forEach(function (card) {
            if (!(card.value === cards[0].value)) {
                throw Error('Cannot play bomb because values of the submitted cards are not all the same!');
            }
        });
        // Determine if it is a strong bomb or a weak bomb
        var strongBomb = true;
        var cardsToBePushed = [];
        cards.forEach(function (card) {
            if (card.wasHidden && !(card.value === _this.masterNumber)) {
                strongBomb = false;
            }
            cardsToBePushed.push({
                card: card,
                playedBy: _this._currentPlayer
            });
            _this._currentRoundTopCards.push(card);
            _this._currentPlayer.removeCard(card);
        });
        this._currentRoundCards = this._currentRoundCards.concat(cardsToBePushed);
        var currentPlayer = this._currentPlayer;
        this.currentRoundCount++;
        this._currentPlayer = this.nextPlayer;
        if (strongBomb) {
            this.emit('strongBomb', { cards: cardsToBePushed, player: currentPlayer });
        }
        else {
            this.emit('weakBomb', { cards: cardsToBePushed, player: currentPlayer });
        }
    };
    Game.prototype.playForBomb = function (cards) {
        var _this = this;
        cards.forEach(function (card) {
            if (!_this._currentPlayer.hasCard(card)) {
                throw Error("The current player does not have card " + card.toString() + " at hand!");
            }
        });
        // Validate against `currentRoundTopCards`
        var strongBomb = !this._currentRoundTopCards.find(function (card) { return card.wasHidden; });
        if (strongBomb) {
            var playedMasterCardCount = cards.filter(function (card) { return card.isMaster(_this.masterColor, _this.masterNumber); }).length;
            var masterCardCount = this._currentPlayer.hand.filter(function (card) { return card.isMaster(_this.masterColor, _this.masterNumber); }).length;
            if (playedMasterCardCount < 4 && masterCardCount > playedMasterCardCount) {
                throw Error('You must play your remaining master cards!');
            }
        }
        else {
            var colorsArray = [card_1.Colors.HEART, card_1.Colors.SPADE, card_1.Colors.DIAMOND, card_1.Colors.CLUB].filter(function (color) {
                return !(color === _this.masterColor);
            });
            var missingColors_1 = [];
            // Look for one from each color
            colorsArray.forEach(function (color) {
                if (!cards.find(function (card) { return (card.color === color && !(card.value === _this.masterNumber)); })) {
                    missingColors_1.push(color);
                }
            });
            missingColors_1.forEach(function (color) {
                var hasSameColorCard = _this._currentPlayer.hand.find(function (card) {
                    return (card.color === color && !(card.value === _this.masterNumber));
                });
                if (hasSameColorCard) {
                    throw Error("You have a card with color " + color + " but you did not play!");
                }
            });
            // Look for one master card (if master color is not joker)
            if (!(this.masterColor === card_1.Colors.JOKER)) {
                var containsMasterCard = cards.find(function (card) {
                    return card.isMaster(_this.masterColor, _this.masterNumber);
                });
                var hasMasterCardAtHand = !!this._currentPlayer.hand.find(function (card) { return card.isMaster(_this.masterColor, _this.masterNumber); });
                if (!containsMasterCard && hasMasterCardAtHand) {
                    throw Error('You are missing a master card!');
                }
            }
        }
        var currentPlayer = this._currentPlayer;
        var cardsToBePushed = [];
        cards.forEach(function (card) {
            cardsToBePushed.push({
                card: card,
                playedBy: _this._currentPlayer
            });
            _this._currentPlayer.removeCard(card);
        });
        this._currentRoundCards = this._currentRoundCards.concat(cardsToBePushed);
        this.currentRoundCount++;
        if (this.currentRoundCount === 4) {
            this.cleanBombRound();
        }
        else {
            this._currentPlayer = this.nextPlayer;
        }
        this.emit('forBombCardplay', { player: currentPlayer, cards: cardsToBePushed });
    };
    Game.prototype.cleanBombRound = function () {
        var _this = this;
        var _a;
        if (!(this.currentRoundCount === 4)) {
            throw Error('Not everyone has played four cards yet!');
        }
        var cardsToAdd = [];
        var player = this._currentRoundCards[0].playedBy;
        if (this._currentRoundCards[0].playedBy.role === 'ATTACK') {
            cardsToAdd = this._currentRoundCards.filter(function (playedCard) { return playedCard.card.isSpecial(); }).map(function (playedCard) {
                return {
                    card: playedCard.card,
                    points: playedCard.card.pointsHeld()
                };
            });
            this._currentRoundCards = this._currentRoundCards.filter(function (playedCard) { return !playedCard.card.isSpecial(); });
            (_a = this.teams.find(function (team) { return team.role === 'ATTACK'; })) === null || _a === void 0 ? void 0 : _a.ownedCards.concat(cardsToAdd);
        }
        var roundWinningTeam = this.teams.find(function (team) { return team.role === player.role; });
        setTimeout(function () { return _this.emit('roundend', { winner: roundWinningTeam, discardedCards: discardedCards, takenCards: cardsToAdd }); }, 0);
        var discardedCards = this._currentRoundCards;
        this._discardedPile = this._discardedPile.concat(discardedCards);
        this.roundCount += 4;
        this._currentRoundCards = [];
        this._currentRoundTopCards = [];
        this.currentRoundCount = 0;
        if (this.roundCount === 12) {
            var score_2 = this.calculateScore(true);
            // Emit event
            setTimeout(function () { return _this.emit('end', { score: score_2, flipCards: true }); }, 0);
        }
        else {
            // Init new round
            this.initRound(player);
        }
    };
    Game.prototype.initRound = function (player) {
        this._currentPlayer = player;
    };
    Game.prototype.cleanRound = function () {
        var _this = this;
        if (!(this.currentRoundCount === 4)) {
            throw Error('Not everyone has played a card yet!');
        }
        var firstCard = this._currentRoundCards[0].card;
        // Find largest card in `_currentRoundCards`
        // return 1 if b > a
        // return -1 if a > b
        var sortedCards = this._currentRoundCards.sort(function (a, b) {
            var aMaster = a.card.isMaster(_this.masterColor, _this.masterNumber);
            var bMaster = b.card.isMaster(_this.masterColor, _this.masterNumber);
            if (aMaster && !bMaster) {
                return -1;
            }
            else if (bMaster && !aMaster) {
                return 1;
            }
            else if (aMaster && bMaster) {
                if (a.card.isJoker() || b.card.isJoker()) {
                    return a.card.value > b.card.value ? -1 : 1;
                }
                else if (a.card.value === _this.masterNumber && b.card.value !== _this.masterNumber) {
                    return -1;
                }
                else if (b.card.value === _this.masterNumber && a.card.value !== _this.masterNumber) {
                    return 1;
                }
                else if (a.card.value === _this.masterNumber && b.card.value === _this.masterNumber) {
                    if (a.card.color === _this.masterColor) {
                        return -1;
                    }
                    else if (b.card.color === _this.masterColor) {
                        return 1;
                    }
                    else {
                        return 0;
                    }
                }
                else {
                    return a.card.value > b.card.value ? -1 : 1;
                }
            }
            else if (!aMaster && !bMaster) {
                if (a.card.color !== _this._currentRoundCards[0].card.color && b.card.color === _this._currentRoundCards[0].card.color) {
                    return 1;
                }
                else if (b.card.color !== _this._currentRoundCards[0].card.color && a.card.color === _this._currentRoundCards[0].card.color) {
                    return -1;
                }
                else {
                    return a.card.value > b.card.value ? -1 : 1;
                }
            }
            else {
                return 0;
            }
        });
        var largestCard = sortedCards[0];
        sortedCards.forEach(function (card) { return console.log(card.card.toString()); });
        var roundWinningTeam = this.getPlayerTeam(largestCard.playedBy);
        var cardsToAdd = [];
        // Find point-holding cards and add
        if (roundWinningTeam.role === 'ATTACK') {
            cardsToAdd = this._currentRoundCards.filter(function (playedCard) { return playedCard.card.isSpecial(); }).map(function (playedCard) {
                return {
                    card: playedCard.card,
                    points: playedCard.card.pointsHeld()
                };
            });
            this._currentRoundCards = this._currentRoundCards.filter(function (playedCard) { return !playedCard.card.isSpecial(); });
            roundWinningTeam.ownedCards = roundWinningTeam.ownedCards.concat(cardsToAdd);
        }
        // Find cards not holding points and move to discarded pile
        var discardedCards = this._currentRoundCards;
        this._discardedPile = this._discardedPile.concat(discardedCards);
        setTimeout(function () { return _this.emit('roundend', { winner: roundWinningTeam, discardedCards: discardedCards, takenCards: cardsToAdd }); }, 0);
        // Clear current round cards
        this._currentRoundCards = [];
        this.currentRoundCount = 0;
        this.roundCount++;
        // Check if the game has finished
        if (this.roundCount === 12) {
            var score_3;
            var flipCards_1;
            // Calculate score
            if (roundWinningTeam.role === 'ATTACK') {
                flipCards_1 = true;
                score_3 = this.calculateScore(true);
            }
            else {
                flipCards_1 = false;
                score_3 = this.calculateScore(false);
            }
            // Emit event
            setTimeout(function () { return _this.emit('end', { score: score_3, flipCards: flipCards_1 }); }, 0);
        }
        else {
            // Init new round
            this.initRound(largestCard.playedBy);
        }
    };
    Game.prototype.calculateScore = function (revealHiddenCards) {
        var score = 0;
        if (revealHiddenCards) {
            var hiddenCardScore = this._hiddenCards.reduce(function (accumulator, current) {
                return accumulator + current.pointsHeld();
            }, 0);
            score += hiddenCardScore;
        }
        var attackTeamScore = this._teams.find(function (team) { return team.role === 'ATTACK'; }).ownedCards.reduce(function (accumulator, current) {
            return accumulator + current.points;
        }, 0);
        score += attackTeamScore;
        return score;
    };
    Game.prototype.getPlayerTeam = function (name) {
        if (!(typeof name === 'string')) {
            name = name.name;
        }
        ;
        return this._teams.filter(function (team) {
            return !(team.players.filter(function (player) { return player.name === name; }).length === 0);
        })[0];
    };
    Game.prototype.getPlayerIndex = function (name) {
        if (!(typeof name === 'string')) {
            name = name.name;
        }
        ;
        return this._players.findIndex(function (player) { return player.name === name; });
    };
    Game.prototype.getPlayerByName = function (name) {
        var player = this._players[this.getPlayerIndex(name)];
        if (!player) {
            return undefined;
        }
        ;
        return player;
    };
    Game.prototype.findMostDuplicates = function (array) {
        var count_obj = {};
        for (var i = 0; i < array.length; i++) {
            count_obj[array[i]] = count_obj[array[i]] ? count_obj[array[i]] + 1 : 1;
        }
        var keysSorted = Object.keys(count_obj).sort(function (a, b) { return count_obj[b] - count_obj[a]; });
        return keysSorted[0];
    };
    Object.defineProperty(Game.prototype, "discardedPile", {
        get: function () {
            return this._discardedPile;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Game.prototype, "currentRoundCards", {
        get: function () {
            return this._currentRoundCards;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Game.prototype, "players", {
        get: function () {
            return this._players;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Game.prototype, "teams", {
        get: function () {
            return this._teams;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Game.prototype, "hiddenCards", {
        get: function () {
            return this._hiddenCards;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Game.prototype, "currentPlayer", {
        get: function () {
            return this._currentPlayer;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Game.prototype, "nextPlayer", {
        get: function () {
            var index = this.getPlayerIndex(this._currentPlayer);
            if (++index === 4) {
                index = 0;
            }
            return this._players[index];
        },
        enumerable: false,
        configurable: true
    });
    return Game;
}(events_1.EventEmitter));
exports.Game = Game;
