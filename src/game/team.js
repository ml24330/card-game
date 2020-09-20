"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Team = void 0;
var Team = /** @class */ (function () {
    function Team(_a, role) {
        var player1 = _a[0], player2 = _a[1];
        this._players = [player1, player2];
        this.role = role;
        this._ownedCards = [];
    }
    Object.defineProperty(Team.prototype, "players", {
        get: function () {
            return this._players;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Team.prototype, "ownedCards", {
        get: function () {
            return this._ownedCards;
        },
        set: function (cards) {
            this._ownedCards = cards;
        },
        enumerable: false,
        configurable: true
    });
    Team.prototype.addCard = function (_card) {
        var cardToAdd = {
            card: _card,
            points: _card.pointsHeld()
        };
        this._ownedCards.push(cardToAdd);
    };
    return Team;
}());
exports.Team = Team;
