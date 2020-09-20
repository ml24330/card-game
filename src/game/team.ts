import { Player } from './player.js';
import { Card } from './card';

interface ownedCard {
    card: Card,
    points: number
}

export class Team {
    private _players: [Player, Player];
    private _ownedCards: ownedCard[];

    role: 'ATTACK' | 'DEFEND';

    constructor([player1, player2]: [Player, Player], role: 'ATTACK' | 'DEFEND'){
        this._players = [player1, player2];
        this.role = role;
        this._ownedCards = [];
    }

    get players() {
        return this._players;
    }

    get ownedCards() {
        return this._ownedCards;
    }

    set ownedCards(cards: ownedCard[]) {
        this._ownedCards = cards;
    }

    addCard(_card: Card){
        let cardToAdd: ownedCard = {
            card: _card,
            points: _card.pointsHeld()
        };
        this._ownedCards.push(cardToAdd);
    }
}