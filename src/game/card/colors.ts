export enum Colors {
    HEART = 1,
    SPADE,
    CLUB,
    DIAMOND,
    JOKER
}

export function isValidColor(color: number): boolean {
    if(color === Colors.HEART || color === Colors.SPADE || color === Colors.CLUB || color === Colors.DIAMOND || color === Colors.JOKER){
        return true;
    }else{
        return false;
    }
}