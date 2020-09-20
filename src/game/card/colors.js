"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isValidColor = exports.Colors = void 0;
var Colors;
(function (Colors) {
    Colors[Colors["HEART"] = 1] = "HEART";
    Colors[Colors["SPADE"] = 2] = "SPADE";
    Colors[Colors["CLUB"] = 3] = "CLUB";
    Colors[Colors["DIAMOND"] = 4] = "DIAMOND";
    Colors[Colors["JOKER"] = 5] = "JOKER";
})(Colors = exports.Colors || (exports.Colors = {}));
function isValidColor(color) {
    if (color === Colors.HEART || color === Colors.SPADE || color === Colors.CLUB || color === Colors.DIAMOND || color === Colors.JOKER) {
        return true;
    }
    else {
        return false;
    }
}
exports.isValidColor = isValidColor;
