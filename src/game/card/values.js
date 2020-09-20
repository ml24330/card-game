"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pointsHeld = exports.isJoker = exports.Values = void 0;
var Values;
(function (Values) {
    // Regular numberS
    Values[Values["TWO"] = 2] = "TWO";
    Values[Values["THREE"] = 3] = "THREE";
    Values[Values["FOUR"] = 4] = "FOUR";
    Values[Values["FIVE"] = 5] = "FIVE";
    Values[Values["SIX"] = 6] = "SIX";
    Values[Values["SEVEN"] = 7] = "SEVEN";
    Values[Values["EIGHT"] = 8] = "EIGHT";
    Values[Values["NINE"] = 9] = "NINE";
    Values[Values["TEN"] = 10] = "TEN";
    // Non-number cards
    Values[Values["JACK"] = 11] = "JACK";
    Values[Values["QUEEN"] = 12] = "QUEEN";
    Values[Values["KING"] = 13] = "KING";
    Values[Values["ACE"] = 14] = "ACE";
    // Joker
    Values[Values["SMALL_JOKER"] = 15] = "SMALL_JOKER";
    Values[Values["BIG_JOKER"] = 16] = "BIG_JOKER";
})(Values = exports.Values || (exports.Values = {}));
function isJoker(value) {
    if (value === Values.SMALL_JOKER || value === Values.BIG_JOKER) {
        return true;
    }
    else {
        return false;
    }
}
exports.isJoker = isJoker;
function pointsHeld(value) {
    if (value === Values.FIVE) {
        return 5;
    }
    else if (value === Values.TEN || value === Values.KING) {
        return 10;
    }
    else {
        return 0;
    }
}
exports.pointsHeld = pointsHeld;
