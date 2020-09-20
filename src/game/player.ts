import { Card, Values, Colors } from './card';

export class Player {
    name: string;
    hand: Card[] = [];
    role: 'ATTACK' | 'DEFEND';

    constructor(name: string, role: 'ATTACK' | 'DEFEND') {
        this.name = name;
        this.role = role;
    }

    sortHand(masterNumber: Values | 'JOKER', masterColor: Colors = Colors.JOKER) {
        const sorter = (a: Card, b: Card) => {
            return a.value > b.value ? 1 : -1;
        }

        const masterSorter = (a: Card, b: Card) => {
            if(a.value === masterNumber && b.value !== masterNumber && b.color !== Colors.JOKER){
                return 1;
            }else if(b.value === masterNumber && a.value !== masterNumber && a.color !== Colors.JOKER){
                return -1;
            }else{
                return a.value > b.value ? 1 : -1;
            }
        }

        let cards: Card[] = [];
        let colors = [Colors.DIAMOND, Colors.CLUB, Colors.HEART, Colors.SPADE].filter(color => !(color === masterColor));
        colors.forEach(color => {
            let cardsToAdd = this.hand.filter(card => card.color === color && !(card.isMaster(masterColor, masterNumber))).sort(sorter);
            cards = cards.concat(cardsToAdd);
        });

        let masterCards = this.hand.filter(card => card.isMaster(masterColor, masterNumber));
        masterCards.sort(masterSorter);
        cards = cards.concat(masterCards);
        
        this.hand = cards;
    }
    
    hasCard(card: Card) {
        if(this.hand.filter(_card => _card.color === card.color && _card.value === card.value).length === 0){
            return false;
        }else{
            return true;
        }
    }

    removeCard(card: Card){
        // Return if player does not have card
        if(!this.hasCard(card)){
            return;
        }

        // Remove card from hand
        const i = this.hand.findIndex(
            (c) => c.value === card.value && c.color === card.color,
          );
        this.hand.splice(i, 1);
    }
}