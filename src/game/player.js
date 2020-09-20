"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Player = void 0;
var card_1 = require("./card");
var Player = /** @class */ (function () {
    function Player(name, role) {
        this.hand = [];
        this.name = name;
        this.role = role;
    }
    Player.prototype.sortHand = function (masterNumber, masterColor) {
        var _this = this;
        if (masterColor === void 0) { masterColor = card_1.Colors.JOKER; }
        var sorter = function (a, b) {
            return a.value > b.value ? 1 : -1;
        };
        var masterSorter = function (a, b) {
            if (a.value === masterNumber && b.value !== masterNumber && b.color !== card_1.Colors.JOKER) {
                return 1;
            }
            else if (b.value === masterNumber && a.value !== masterNumber && a.color !== card_1.Colors.JOKER) {
                return -1;
            }
            else {
                return a.value > b.value ? 1 : -1;
            }
        };
        var cards = [];
        var colors = [card_1.Colors.DIAMOND, card_1.Colors.CLUB, card_1.Colors.HEART, card_1.Colors.SPADE].filter(function (color) { return !(color === masterColor); });
        colors.forEach(function (color) {
            var cardsToAdd = _this.hand.filter(function (card) { return card.color === color && !(card.isMaster(masterColor, masterNumber)); }).sort(sorter);
            cards = cards.concat(cardsToAdd);
        });
        var masterCards = this.hand.filter(function (card) { return card.isMaster(masterColor, masterNumber); });
        masterCards.sort(masterSorter);
        cards = cards.concat(masterCards);
        this.hand = cards;
    };
    Player.prototype.hasCard = function (card) {
        if (this.hand.filter(function (_card) { return _card.color === card.color && _card.value === card.value; }).length === 0) {
            return false;
        }
        else {
            return true;
        }
    };
    Player.prototype.removeCard = function (card) {
        // Return if player does not have card
        if (!this.hasCard(card)) {
            return;
        }
        // Remove card from hand
        var i = this.hand.findIndex(function (c) { return c.value === card.value && c.color === card.color; });
        this.hand.splice(i, 1);
    };
    return Player;
}());
exports.Player = Player;
