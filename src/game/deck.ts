import { Colors, Values, Card } from './card';
import shuffle from 'shuffle-array';

function createDeck() {
    // Init deck
    const deck: Card[] = [];

    // Populate with unshuffled cards
    for(let j=1;j<5;j++){
        for(let i=2;i<15;i++){
            deck.push(new Card(i, j));
        }
    }
    // // This is for easier debugging with bombs
    // for(let j=1;j<5;j++){
    //     deck.push(new Card(14, j));
    // }
    deck.push(new Card(15), new Card(16));

    // Shuffle deck
    shuffle(deck);

    return deck;
}

export class Deck {
    private shuffle = createDeck();

    get cards() {
        return this.shuffle;
    }

    get length() {
        return this.shuffle.length;
    }

    draw() {
        // Mark and remove card from deck
        let card = this.cards[0];
        this.shuffle.shift();

        return card;
    }

    takeRemaining() {
        this.cards.forEach(card => {
            card.wasHidden = true;
        });

        // Mark cards to return and clear shuffle
        let cards = this.cards;
        this.shuffle = [];

        return cards;
    }
}

