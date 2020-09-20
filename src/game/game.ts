// Start the game here

import { EventEmitter } from 'events';
import { Card, Colors, Values } from './card';
import { Player } from './player.js';
import { Deck } from './deck.js';
import { Team } from './team.js';

interface discardedCard {
    card: Card,
    playedBy: Player
}

export class Game extends EventEmitter {
    private _teams: [Team, Team];
    private _players: Player[] = [];
    private _currentPlayer: Player;
    private _hiddenCards: Card[];
    private _currentRoundCards: discardedCard[] = [];
    private _discardedPile: (discardedCard | undefined)[];
    private _currentRoundTopCards: Card[] = [];

    drawPile: Deck;
    phase: 'DRAWING' | 'TAKING' | 'PUTTING' | 'PLAYING';
    currentRoundCount: number = 0;
    roundCount: number = 0;
    masterNumber: Values | 'JOKER';
    masterColor: Colors;

    // p1 and p2 ATTACKS; p3 and p4 DEFENDS
    constructor([[p1, p2], [p3, p4]]: [[string, string], [string, string]], masterNumber: Values | 'JOKER'){
        super();

        this.masterNumber = masterNumber;
        this._discardedPile = [];

        if(!p1 || !p2 || !p3 || !p4){
            throw Error('The game must be started with four players, with two on each team!');
        }

        let player_1 = new Player(p1, 'ATTACK');
        let player_2 = new Player(p2, 'ATTACK');
        let player_3 = new Player(p3, 'DEFEND');
        let player_4 = new Player(p4, 'DEFEND');

        this._teams = [new Team([player_1, player_2], 'ATTACK'), new Team([player_3, player_4], 'DEFEND')];

        this._players = [player_1, player_3, player_2, player_4];
    }
    
    start() {
        // Init draw pile
        this.drawPile = new Deck();

        // Select starting player
        this._currentPlayer = this.players[Math.floor(Math.random() * 4)];

        // Set game phase to drawing
        this.phase = 'DRAWING';
        this.emit('phaseChange', { phase: this.phase });

        // Skip drawing if master number is joker
        if(this.masterNumber === 'JOKER'){
            this.masterColor = Colors.JOKER;
            while(this.drawPile.length > 6){
                this.draw();
            }
        }
    }

    draw() {
        // Check if phase is drawing
        if(!(this.phase === 'DRAWING')){
            throw Error('You cannot draw cards at this point!');
        }

        // Draw card for current player
        let card_drawn = this.drawPile.draw();

        this._currentPlayer.hand = this._currentPlayer.hand.concat([card_drawn]);
        this.masterColor ? this._currentPlayer.sortHand(this.masterNumber, this.masterColor) : this._currentPlayer.sortHand(this.masterNumber);
        
        // Emit draw event
        this.emit('draw', {player: this._currentPlayer.name, card: card_drawn});

        // Check if six cards will remain
        if(this.drawPile.length === 6){
            // Check if master color is still to be decided
            if(!this.masterColor){
                let colors_array: Colors[] = this.drawPile.cards.map(card => card.color)
                this.masterColor = +this.findMostDuplicates(colors_array) as Colors;
            }

            this.players.forEach(player => player.sortHand(this.masterNumber, this.masterColor));
            this._hiddenCards = this.drawPile.cards;

            this.phase = 'TAKING';
            // Emit event
            this.emit('phaseChange', { phase: this.phase });
        }

        

        // Move to next player
        this._currentPlayer = this.nextPlayer;
    }

    setMasterColor(card: Card) {
        // Check if phase is drawing
        if(!(this.phase === 'DRAWING')){
            throw Error('Master color can only be set while drawing!');
        }

        // Check if card is a master card
        if(!(card.value === this.masterNumber)){
            throw Error('You cannot declare a master color with the card!');
        }

        this.masterColor = card.color;

        // Distribute remaining cards
        while(this.drawPile.length > 6){
            this.draw();
        }
    }

    takeRemaining(playerName: string) {
        // Check if phase is taking
        if(!(this.phase === 'TAKING')){
            throw Error('You cannot take remaining cards at this point!');
        }

        // Find player and give card
        let player = this.getPlayerByName(playerName);

        if(!player){
            throw Error('This player does not exist!');
        }

        if(!(this.getPlayerTeam(player).role === 'DEFEND')){
            throw Error('Only the defending team can take remaining cards!');
        }

        let cardsTaken = this.drawPile.takeRemaining();

        player.hand = player.hand.concat(cardsTaken);
        player.sortHand(this.masterNumber, this.masterColor);

        this.emit('cardtake', { player: player.name, cards: cardsTaken });

        this.phase = 'PUTTING';
        this.emit('phaseChange', { phase: this.phase });
    }

    putDownHiddenCards(playerName: string, cardsToBePutDown: Card[]) {
        // Check if phase is putting
        if(!(this.phase === 'PUTTING')){
            throw Error('You cannot put down hidden cards at this point!');
        }

        // Check if six cards are being put down
        if(!(cardsToBePutDown.length === 6)){
            throw Error('You must put down six cards!');
        }

        // Check if cards carry more than 25 points
        let totalPoints = cardsToBePutDown.reduce((accumulator, current) => {
            return accumulator + current.pointsHeld();
        }, 0);
        
        if(totalPoints > 25){
            throw Error('You can only put cards carrying a maximum of 25 points down!');
        }
        
        // Find player
        let player = this.getPlayerByName(playerName)!;

        if(!player){
            throw Error('This player does not exist!');
        }

        cardsToBePutDown.forEach(card => {
            if(!player.hasCard){
                throw Error(`Cannot find card ${card.value} ${card.color} on player ${player.name}!`);
            }
        });

        cardsToBePutDown.forEach(card => {
            player.removeCard(card);
        });

        this._hiddenCards = cardsToBePutDown;

        this.emit('cardput', { player: playerName, cards: cardsToBePutDown });

        this.phase = 'PLAYING';
        this.players.forEach(player => player.sortHand(this.masterNumber, this.masterColor));
        this.emit('phaseChange', { phase: this.phase });

        let currentPlayer = this.getPlayerTeam(player).players.find(player => player.name === playerName)!;

        this.initRound(currentPlayer);
    }

    play(cardToBePlayed: Card) {
        // Throw error if four players have already played
        if(this._currentRoundCards.length > 3){
            throw Error('Players can only play once every round!');
        }

        // Throw error if player does not have card
        if(!this._currentPlayer.hasCard(cardToBePlayed)){
            throw Error(`Current player ${this._currentPlayer.name} does not have card ${cardToBePlayed.toString()} at hand!`);
        }

        let currentPlayer = this._currentPlayer;

        // Throw error if player has matching cards but did not play
        if(this._currentRoundCards.length > 0){
            if(cardToBePlayed.isMaster(this.masterColor, this.masterNumber) && !this._currentRoundCards[0].card.isMaster(this.masterColor, this.masterNumber)){
                let has_matching: boolean = !!this._currentPlayer.hand.find(card => (card.color === this._currentRoundCards[0].card.color && !card.isMaster(this.masterColor, this.masterNumber)));
                if(has_matching){
                    throw Error(`You cannot play card ${cardToBePlayed.toString()} because you have other matching cards!`);
                }
            }

            if(!(cardToBePlayed.color === this._currentRoundCards[0].card.color) && !(cardToBePlayed.isMaster(this.masterColor, this.masterNumber) && this._currentRoundCards[0].card.isMaster(this.masterColor, this.masterNumber))){
                let has_matching;

                if(!this._currentRoundCards[0].card.isMaster(this.masterColor, this.masterNumber)){
                    has_matching = !(this._currentPlayer.hand.filter(card => {
                        if(!card.isMaster(this.masterColor, this.masterNumber)){
                            return card.color === this._currentRoundCards[0].card.color;
                        }
                    }).length === 0)
                }else if(this._currentRoundCards[0].card.isMaster(this.masterColor, this.masterNumber)){
                    has_matching = !(this._currentPlayer.hand.filter(card => {
                        return card.isMaster(this.masterColor, this.masterNumber);
                    }).length === 0)
                }

                if(has_matching){
                    throw Error(`You cannot play card ${cardToBePlayed.toString()} because you have other matching cards!`);
                }
            }
        }

        let cardToBePushed = {
            card: cardToBePlayed,
            playedBy: this._currentPlayer
        }
            
        this._currentRoundCards.push(cardToBePushed);

        this._currentPlayer.removeCard(cardToBePlayed);

        this.currentRoundCount++;

        // Check if everyone has played
        if(this.currentRoundCount === 4){
            this.cleanRound();
        }else{
            this._currentPlayer = this.nextPlayer;
        }

        // Emit event
        this.emit('cardplay', {player: currentPlayer, card: cardToBePushed});
    }

    playTopCards(cards: Card[]) {
        if(cards.length < 2){
            throw Error('You are not playing two or more cards! Use the regular `play` method instead.');
        }

        cards.forEach(card => {
            if(cards[0].isMaster(this.masterColor, this.masterNumber)){
                if(!card.isMaster(this.masterColor, this.masterNumber)){
                    throw Error('Cannot play cards because they do not have the same color!');
                }
            }else{
                if(card.color !== cards[0].color){
                    throw Error('Cannot play cards because they do not have the same color!');
                }
            }
        });

        let smallestCard = cards.reduce((previous, current) => {
            if(cards[0].isMaster(this.masterColor, this.masterNumber)){
                if(previous.value === this.masterNumber && current.value === this.masterNumber && current.color === this.masterColor){
                    return previous;
                }else if(previous.value === this.masterNumber && current.value < Values.SMALL_JOKER){
                    return current;
                }else if(current.value < previous.value){
                    return current;
                }else{
                    return previous;
                }
            }else if(current.value < previous.value) {
                return current;
            }else{
                return previous;
            }
        }, cards[0]);

        // Check if anyone challenges
        let waitForChallenge = async () => {
            this.emit('requestChallenge', {cards, player: this._currentPlayer});
            return new Promise((resolve, reject) => {
                let respondedPlayers: Set<string> = new Set();
                this.on('noChallenge', (playerName) => {
                    respondedPlayers.add(playerName);
                    this.emit('failedChallenge', playerName);
                    if(respondedPlayers.size === 3){
                        resolve();
                    }
                });
                this.on('challenge', ({card, playerName}) => {
                    let isMaster = cards[0].isMaster(this.masterColor, this.masterNumber);
                    if(isMaster){
                        if((card.value === this.masterNumber && !(smallestCard.value === this.masterNumber) && smallestCard.value < 14) || (card.value === this.masterNumber && card.color === this.masterColor && smallestCard.value < Values.SMALL_JOKER)){
                            this.emit('successfulChallenge', {card, playerName});
                            reject();
                        }else if(card.isMaster(this.masterColor, this.masterNumber) && card.value > smallestCard.value){
                            this.emit('successfulChallenge', {card, playerName});
                            reject();
                        }else{
                            respondedPlayers.add(playerName);
                            this.emit('failedChallenge', playerName);
                            if(respondedPlayers.size === 3){
                                resolve();
                            }
                        }
                    }else{
                        if(card.color === smallestCard.color && card.value > smallestCard.value){
                            this.emit('successfulChallenge', {card, playerName});
                            reject();
                        }else{
                            respondedPlayers.add(playerName);
                            this.emit('failedChallenge', playerName);
                            if(respondedPlayers.size === 3){
                                resolve();
                            }
                        }
                    }
                });
            });
        } 

        let cardsToBePushed: discardedCard[] = [];

        waitForChallenge()
        .then(() => {
            cards.forEach(card => {
                cardsToBePushed.push({
                    card: card,
                    playedBy: this._currentPlayer
                });

                this._currentRoundTopCards.push(card);
    
                this._currentPlayer.removeCard(card);
            });

            this._currentRoundCards = this._currentRoundCards.concat(cardsToBePushed);

            let currentPlayer = this._currentPlayer;

            this.currentRoundCount++;
            this._currentPlayer = this.nextPlayer;

            this.emit('multipleCardplay', {cards: cardsToBePushed, player: currentPlayer});
        })
        .catch(() => {
            this.play(smallestCard);
        })
        .finally(() => {
            this.removeAllListeners('challenge');
            this.removeAllListeners('noChallenge');
        })
    }

    playForTopCards(cards: Card[]) {
        cards.forEach(card => {
            if(!this._currentPlayer.hasCard(card)){
                throw Error(`The current player does not have card ${card.toString()} at hand!`);
            }
        });

        if(!(cards.length === this._currentRoundTopCards.length)){
            throw Error(`Expected ${this._currentRoundTopCards.length} cards, but received ${cards.length}!`);
        }

        let isMaster: boolean = this._currentRoundTopCards[0].isMaster(this.masterColor, this.masterNumber);

        if(isMaster){
            let playedMasterCardCount: number = cards.filter(card => card.isMaster(this.masterColor, this.masterNumber)).length;
            let masterCardCount: number = this._currentPlayer.hand.filter(card => card.isMaster(this.masterColor, this.masterNumber)).length;

            if(playedMasterCardCount < this._currentRoundTopCards.length && playedMasterCardCount < masterCardCount){
                throw Error('You must play your remaining master cards!');
            }
        }else{
            let matchingColor: Colors = this._currentRoundTopCards[0].color;

            let playedMatchingColorCardCount: number = cards.filter(card => (card.color === matchingColor && !card.isMaster(this.masterColor, this.masterNumber))).length;
            let matchingColorCardCount: number = this._currentPlayer.hand.filter(card => (card.color === matchingColor && !card.isMaster(this.masterColor, this.masterNumber))).length;

            if(playedMatchingColorCardCount < this._currentRoundTopCards.length && playedMatchingColorCardCount < matchingColorCardCount){
                throw Error(`You must play your remaining cards that matches the color ${Colors[matchingColor]}!`);
            }
        }

        let currentPlayer = this._currentPlayer;

        let cardsToBePushed: discardedCard[] = [];

        cards.forEach(card => {
            cardsToBePushed.push({
                card: card,
                playedBy: this._currentPlayer
            });

            this._currentPlayer.removeCard(card);
        });

        this._currentRoundCards = this._currentRoundCards.concat(cardsToBePushed);

        this.currentRoundCount++;

        if(this.currentRoundCount === 4){
            this.cleanTopCardsRound();
        }else{
            this._currentPlayer = this.nextPlayer;
        }

        this.emit('forMultipleCardplay', {player: currentPlayer, cards: cardsToBePushed});
    }

    cleanTopCardsRound() {
        if(!(this.currentRoundCount === 4)){
            throw Error('Not everyone has played four cards yet!');
        }

        let cardsToAdd: any = [];
        let player = this._currentRoundCards[0].playedBy;

        // Find if someone played only master cards
        let cardsPerPlayer = this._currentRoundCards.length / 4;
        let cardsByPlayer: discardedCard[][] = [];
        for(let i=0;i<this._currentRoundCards.length;i+=cardsPerPlayer){
            cardsByPlayer.push(this._currentRoundCards.slice(i, i+cardsPerPlayer));
        }

        let allMasterArray: discardedCard[][] = [];

        if(!cardsByPlayer[0][0].card.isMaster(this.masterColor, this.masterNumber)){
            for(let i=1;i<4;i++){
                let allMaster: boolean = !cardsByPlayer[i].find(card => !card.card.isMaster(this.masterColor, this.masterNumber));
                if(allMaster){
                    allMasterArray.push(cardsByPlayer[i]);
                }
            }
        }

        let roundWinningTeam: Team;
        let roundWinningPlayer: Player;

        // Check if multiple players played only master cards
        if(allMasterArray.length > 1){
            // Select the player with the largest master card
            let largestCardArray: discardedCard[] = [];

            allMasterArray.forEach(masterArray => {
                let largestCard = masterArray.reduce((previous, current) => {
                    if(current.card.value > previous.card.value){
                        return current;
                    }else{
                        return previous;
                    }
                }, masterArray[0]);

                largestCardArray.push(largestCard);
            });

            largestCardArray.sort().reverse();

            roundWinningPlayer = largestCardArray[0].playedBy;
        }else if(allMasterArray.length === 1){
            roundWinningPlayer = allMasterArray[0][0].playedBy; 
        }else if(allMasterArray.length === 0){
            roundWinningPlayer = cardsByPlayer[0][0].playedBy;
        }

        roundWinningTeam = this.teams.find(team => team.role === roundWinningPlayer.role)!;

        if(roundWinningTeam.role === 'ATTACK'){
            cardsToAdd = this._currentRoundCards.filter(playedCard => playedCard.card.isSpecial()).map(playedCard => {
                return {
                    card: playedCard.card,
                    points: playedCard.card.pointsHeld()
                };
            });

            this._currentRoundCards = this._currentRoundCards.filter(playedCard => !playedCard.card.isSpecial());
        }

        roundWinningTeam.ownedCards = roundWinningTeam.ownedCards.concat(cardsToAdd as ({
                card: Card,
                points: number
        })[]);

        setTimeout(() => this.emit('roundend', {winner: roundWinningTeam, discardedCards, takenCards: cardsToAdd}), 0);

        let discardedCards = this._currentRoundCards;
        this._discardedPile = this._discardedPile.concat(discardedCards);

        this._currentRoundCards = [];
        this._currentRoundTopCards = [];
        this.currentRoundCount = 0;

        this.roundCount += cardsPerPlayer;

        if(this.roundCount === 12){
            let score: number = this.calculateScore(roundWinningTeam.role === 'ATTACK');

            // Emit event
            setTimeout(() => this.emit('end', {score, flipCards: roundWinningTeam.role === 'ATTACK'}), 0);
        }else{
            // Init new round
            this.initRound(roundWinningPlayer!);
        }
    }

    playBomb(cards: [Card, Card, Card, Card]) {
        cards.forEach(card => {
            if(!(card.value === cards[0].value)){
                throw Error('Cannot play bomb because values of the submitted cards are not all the same!');
            }
        });

        // Determine if it is a strong bomb or a weak bomb
        let strongBomb = true;
        let cardsToBePushed: discardedCard[] = [];
        cards.forEach(card => {
            if(card.wasHidden && !(card.value === this.masterNumber)){
                strongBomb = false;
            }

            cardsToBePushed.push({
                card: card,
                playedBy: this._currentPlayer
            });

            this._currentRoundTopCards.push(card);

            this._currentPlayer.removeCard(card);
        });

        this._currentRoundCards = this._currentRoundCards.concat(cardsToBePushed);

        let currentPlayer = this._currentPlayer;

        this.currentRoundCount++;
        this._currentPlayer = this.nextPlayer;

        if(strongBomb){
            this.emit('strongBomb', {cards: cardsToBePushed, player: currentPlayer});
        }else{
            this.emit('weakBomb', {cards: cardsToBePushed, player: currentPlayer});
        }
    }

    playForBomb(cards: Card[]) {
        cards.forEach(card => {
            if(!this._currentPlayer.hasCard(card)){
                throw Error(`The current player does not have card ${card.toString()} at hand!`);
            }
        });

        // Validate against `currentRoundTopCards`
        let strongBomb = !this._currentRoundTopCards.find(card => card.wasHidden);

        if(strongBomb){
            let playedMasterCardCount: number = cards.filter(card => card.isMaster(this.masterColor, this.masterNumber)).length;

            let masterCardCount = this._currentPlayer.hand.filter(card => card.isMaster(this.masterColor, this.masterNumber)).length;

            if(playedMasterCardCount < 4 && masterCardCount > playedMasterCardCount){
                throw Error('You must play your remaining master cards!');
            }
        }else{
            let colorsArray: Colors[] = [Colors.HEART, Colors.SPADE, Colors.DIAMOND, Colors.CLUB].filter(color => {
                return !(color === this.masterColor);
            });

            let missingColors: Colors[] = [];

            // Look for one from each color
            colorsArray.forEach(color => {
                if(!cards.find(card => (card.color === color && !(card.value === this.masterNumber)))){
                    missingColors.push(color);
                }
            });

            missingColors.forEach(color => {
                let hasSameColorCard = this._currentPlayer.hand.find(card => {
                    return (card.color === color && !(card.value === this.masterNumber));
                })
                if(hasSameColorCard){
                    throw Error(`You have a card with color ${color} but you did not play!`);
                }
            });

            // Look for one master card (if master color is not joker)
            if(!(this.masterColor === Colors.JOKER)){
                let containsMasterCard = cards.find(card => {
                    return card.isMaster(this.masterColor, this.masterNumber);
                });

                let hasMasterCardAtHand = !!this._currentPlayer.hand.find(card => card.isMaster(this.masterColor, this.masterNumber));

                if(!containsMasterCard && hasMasterCardAtHand){
                    throw Error('You are missing a master card!');
                }
            }
        }

        let currentPlayer = this._currentPlayer;

        let cardsToBePushed: discardedCard[] = [];

        cards.forEach(card => {
            cardsToBePushed.push({
                card: card,
                playedBy: this._currentPlayer
            });

            this._currentPlayer.removeCard(card);
        });

        this._currentRoundCards = this._currentRoundCards.concat(cardsToBePushed);

        this.currentRoundCount++;

        if(this.currentRoundCount === 4){
            this.cleanBombRound();
        }else{
            this._currentPlayer = this.nextPlayer;
        }

        this.emit('forBombCardplay', {player: currentPlayer, cards: cardsToBePushed});
    }

    cleanBombRound() {
        if(!(this.currentRoundCount === 4)){
            throw Error('Not everyone has played four cards yet!');
        }

        let cardsToAdd: any = [];
        let player = this._currentRoundCards[0].playedBy;

        if(this._currentRoundCards[0].playedBy.role === 'ATTACK'){
            cardsToAdd = this._currentRoundCards.filter(playedCard => playedCard.card.isSpecial()).map(playedCard => {
                return {
                    card: playedCard.card,
                    points: playedCard.card.pointsHeld()
                };
            });

            this._currentRoundCards = this._currentRoundCards.filter(playedCard => !playedCard.card.isSpecial());

            this.teams.find(team => team.role === 'ATTACK')?.ownedCards.concat(cardsToAdd as ({
                card: Card,
                points: number
            })[]);
        }

        let roundWinningTeam = this.teams.find(team => team.role === player.role);

        setTimeout(() => this.emit('roundend', {winner: roundWinningTeam, discardedCards, takenCards: cardsToAdd}), 0);

        let discardedCards = this._currentRoundCards;
        this._discardedPile = this._discardedPile.concat(discardedCards);

        this.roundCount += 4;

        this._currentRoundCards = [];
        this._currentRoundTopCards = [];
        this.currentRoundCount = 0;

        if(this.roundCount === 12){
            let score: number = this.calculateScore(true);

            // Emit event
            setTimeout(() => this.emit('end', {score, flipCards: true}), 0);
        }else{
            // Init new round
            this.initRound(player);
        }
    }

    initRound(player: Player) {
        this._currentPlayer = player;
    }

    cleanRound() {
        if(!(this.currentRoundCount === 4)){
            throw Error('Not everyone has played a card yet!');
        }

        let firstCard = this._currentRoundCards[0].card;

        // Find largest card in `_currentRoundCards`
        // return 1 if b > a
        // return -1 if a > b
        let sortedCards = this._currentRoundCards.sort((a,b): 0 | 1 | -1 => {
            let aMaster = a.card.isMaster(this.masterColor, this.masterNumber);
            let bMaster = b.card.isMaster(this.masterColor, this.masterNumber);
            if(aMaster && !bMaster){
                return -1;
            }else if(bMaster && !aMaster){
                return 1;
            }else if(aMaster && bMaster){
                if(a.card.isJoker() || b.card.isJoker()){
                    return a.card.value > b.card.value ? -1 : 1;
                }else if(a.card.value === this.masterNumber && b.card.value !== this.masterNumber){
                    return -1;
                }else if(b.card.value === this.masterNumber && a.card.value !== this.masterNumber){
                    return 1;
                }else if(a.card.value === this.masterNumber && b.card.value === this.masterNumber){
                    if(a.card.color === this.masterColor){
                        return -1;
                    }else if(b.card.color === this.masterColor){
                        return 1;
                    }else{
                        return 0;
                    }
                }else{
                    return a.card.value > b.card.value ? -1 : 1;
                }
            }else if(!aMaster && !bMaster){
                if(a.card.color !== this._currentRoundCards[0].card.color && b.card.color === this._currentRoundCards[0].card.color){
                    return 1;
                }else if(b.card.color !== this._currentRoundCards[0].card.color && a.card.color === this._currentRoundCards[0].card.color){
                    return -1;
                }else{
                    return a.card.value > b.card.value ? -1 : 1;
                }
            }else{
                return 0;
            }
        }); 

        let largestCard = sortedCards[0];
        sortedCards.forEach(card => console.log(card.card.toString()));

        let roundWinningTeam = this.getPlayerTeam(largestCard.playedBy);

        let cardsToAdd: any = [];

        // Find point-holding cards and add
        if(roundWinningTeam.role === 'ATTACK'){
            
            cardsToAdd = this._currentRoundCards.filter(playedCard => playedCard.card.isSpecial()).map(playedCard => {
                return {
                    card: playedCard.card,
                    points: playedCard.card.pointsHeld()
                };
            });

            this._currentRoundCards = this._currentRoundCards.filter(playedCard => !playedCard.card.isSpecial());

            roundWinningTeam.ownedCards = roundWinningTeam.ownedCards.concat(cardsToAdd as ({
                card: Card,
                points: number
            })[]);
        }

        // Find cards not holding points and move to discarded pile
        let discardedCards = this._currentRoundCards;

        this._discardedPile = this._discardedPile.concat(discardedCards);

        setTimeout(() => this.emit('roundend', {winner: roundWinningTeam, discardedCards, takenCards: cardsToAdd}), 0);

        // Clear current round cards
        this._currentRoundCards = [];
        this.currentRoundCount = 0;

        this.roundCount++;

        // Check if the game has finished
        if(this.roundCount === 12){
            let score: number;
            let flipCards: boolean;
            // Calculate score
            if(roundWinningTeam.role === 'ATTACK'){
                flipCards = true;
                score = this.calculateScore(true);
            }else{
                flipCards = false;
                score = this.calculateScore(false);
            }

            // Emit event
            setTimeout(() => this.emit('end', {score, flipCards}), 0);
        }else{
            // Init new round
            this.initRound(largestCard.playedBy);
        }
    }

    calculateScore(revealHiddenCards: boolean): number {
        let score = 0;

        if(revealHiddenCards){
            let hiddenCardScore = this._hiddenCards.reduce((accumulator, current) => {
                return accumulator + current.pointsHeld();
            }, 0);

            score += hiddenCardScore;
        }

        let attackTeamScore = this._teams.find(team => team.role === 'ATTACK')!.ownedCards.reduce((accumulator, current) => {
            return accumulator + current.points;
        }, 0);

        score += attackTeamScore;

        return score;
    }

    getPlayerTeam(name: string | Player){
        if(!(typeof name === 'string')){
            name = name.name;
        };

        return this._teams.filter(team => {
            return !(team.players.filter(player => player.name === name).length === 0);
        })[0];
    }

    getPlayerIndex(name: string | Player) {
        if(!(typeof name === 'string')){
            name = name.name;
        };
        return this._players.findIndex(player => player.name === name);
    }

    getPlayerByName(name: string) {
        let player: Player = this._players[this.getPlayerIndex(name)];
        if(!player) { return undefined };
        return player;
    }

    findMostDuplicates(array: (string | number)[]): string | number {

        let count_obj: { [key in string | number]: number } = {};

        for(let i=0;i<array.length;i++){
            count_obj[array[i]] = count_obj[array[i]] ? count_obj[array[i]] + 1 : 1;
        }

        let keysSorted = Object.keys(count_obj).sort((a, b) => count_obj[b]-count_obj[a]);

        return keysSorted[0];
    }

    get discardedPile() {
        return this._discardedPile;
    }

    get currentRoundCards() {
        return this._currentRoundCards;
    }

    get players() {
        return this._players;
    }

    get teams() {
        return this._teams;
    }

    get hiddenCards() {
        return this._hiddenCards;
    }

    get currentPlayer() {
        return this._currentPlayer;
    }

    get nextPlayer() {
        let index = this.getPlayerIndex(this._currentPlayer);
        if(++index === 4){
            index = 0;
        }
        return this._players[index];
    }
}