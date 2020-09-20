import { Values, pointsHeld as _pointsHeld, isJoker as _isJoker } from './values.js';
import { Colors, isValidColor } from './colors.js';

export class Card {
    private _value: Values;
    private _color: Colors;
    
    wasHidden: boolean;

    constructor(value: Values, color?: Colors){
        if(!_isJoker(value) && !isValidColor(color!)){
            throw new Error('Every card must have a color!');
        }

        if(_isJoker(value) && color && !(color === Colors.JOKER)){
            throw new Error('Joker cards cannot have colors!');
        }

        this.wasHidden = false;
        this._value = value;
        this._color = color || Colors.JOKER;
    }

    get value() {
        return this._value;
    }

    get color() {
        return this._color;
    }
    
    isJoker() {
        return _isJoker(this.value);
    }

    isSpecial() {
        return (this.value === Values.FIVE || this.value === Values.TEN || this.value === Values.KING);
    }

    isMaster(currentMasterColor: Colors, currentMasterNumber: Values | 'JOKER') {
        if(this._color === currentMasterColor || this._color === Colors.JOKER || this._value === currentMasterNumber){
            return true;
        }else{
            return false;
        }
    }

    pointsHeld() {
        return _pointsHeld(this.value);
    }

    toString() {
        return `${Values[this._value]} ${Colors[this._color] || ''}`;
    }

}