"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Card = void 0;
var values_js_1 = require("./values.js");
var colors_js_1 = require("./colors.js");
var Card = /** @class */ (function () {
    function Card(value, color) {
        if (!values_js_1.isJoker(value) && !colors_js_1.isValidColor(color)) {
            throw new Error('Every card must have a color!');
        }
        if (values_js_1.isJoker(value) && color && !(color === colors_js_1.Colors.JOKER)) {
            throw new Error('Joker cards cannot have colors!');
        }
        this.wasHidden = false;
        this._value = value;
        this._color = color || colors_js_1.Colors.JOKER;
    }
    Object.defineProperty(Card.prototype, "value", {
        get: function () {
            return this._value;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Card.prototype, "color", {
        get: function () {
            return this._color;
        },
        enumerable: false,
        configurable: true
    });
    Card.prototype.isJoker = function () {
        return values_js_1.isJoker(this.value);
    };
    Card.prototype.isSpecial = function () {
        return (this.value === values_js_1.Values.FIVE || this.value === values_js_1.Values.TEN || this.value === values_js_1.Values.KING);
    };
    Card.prototype.isMaster = function (currentMasterColor, currentMasterNumber) {
        if (this._color === currentMasterColor || this._color === colors_js_1.Colors.JOKER || this._value === currentMasterNumber) {
            return true;
        }
        else {
            return false;
        }
    };
    Card.prototype.pointsHeld = function () {
        return values_js_1.pointsHeld(this.value);
    };
    Card.prototype.toString = function () {
        return values_js_1.Values[this._value] + " " + (colors_js_1.Colors[this._color] || '');
    };
    return Card;
}());
exports.Card = Card;
