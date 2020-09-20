"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Deck = void 0;
var card_1 = require("./card");
var shuffle_array_1 = __importDefault(require("shuffle-array"));
function createDeck() {
    // Init deck
    var deck = [];
    // Populate with unshuffled cards
    for (var j = 1; j < 5; j++) {
        for (var i = 2; i < 15; i++) {
            deck.push(new card_1.Card(i, j));
        }
    }
    // // This is for easier debugging with bombs
    // for(let j=1;j<5;j++){
    //     deck.push(new Card(14, j));
    // }
    deck.push(new card_1.Card(15), new card_1.Card(16));
    // Shuffle deck
    shuffle_array_1.default(deck);
    return deck;
}
var Deck = /** @class */ (function () {
    function Deck() {
        this.shuffle = createDeck();
    }
    Object.defineProperty(Deck.prototype, "cards", {
        get: function () {
            return this.shuffle;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Deck.prototype, "length", {
        get: function () {
            return this.shuffle.length;
        },
        enumerable: false,
        configurable: true
    });
    Deck.prototype.draw = function () {
        // Mark and remove card from deck
        var card = this.cards[0];
        this.shuffle.shift();
        return card;
    };
    Deck.prototype.takeRemaining = function () {
        this.cards.forEach(function (card) {
            card.wasHidden = true;
        });
        // Mark cards to return and clear shuffle
        var cards = this.cards;
        this.shuffle = [];
        return cards;
    };
    return Deck;
}());
exports.Deck = Deck;
