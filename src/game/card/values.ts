export enum Values {
    // Regular numberS
    TWO = 2,
    THREE,
    FOUR,
    FIVE,
    SIX,
    SEVEN,
    EIGHT,
    NINE,
    TEN,
    // Non-number cards
    JACK,
    QUEEN,
    KING,
    ACE,
    // Joker
    SMALL_JOKER,
    BIG_JOKER
}

export function isJoker(value: Values): boolean {
    if(value === Values.SMALL_JOKER || value === Values.BIG_JOKER){
        return true;
    }else{
        return false;
    }
}

export function pointsHeld(value: Values): number {
    if(value === Values.FIVE){
        return 5;
    }else if(value === Values.TEN || value === Values.KING){
        return 10;
    }else{
        return 0;
    }
}