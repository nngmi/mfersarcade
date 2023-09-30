import { Card, CardBack, CardEmpty } from './Card';
import { useDrop } from 'react-dnd';
import './PlayAreas.css'; // assuming you have a CSS file for styles



export const StateArea = ({ game, playerSymbol, currentPlayer }) => {
  function getPlayerLife(game, playerSymbol) {
    // Find the player object where symbol equals playerSymbol
    const player = game.players.find(player => player.symbol === playerSymbol);
    
    // Return the life of the player if found, otherwise return null
    return player ? player.life : null;
  }
  function getOpponentSymbol(playerSymbol) {
    return playerSymbol === 'X' ? 'O' : 'X';
  }
  
  return (
    <div>
      <span className="marginSpan">Game State: {currentPlayer === playerSymbol ? 'Your Turn' : "Other Player's Turn"}</span>
      <span className="marginSpan">Your Life: {getPlayerLife(game, playerSymbol)}</span>
      <span className="marginSpan">Opponent Life: {getPlayerLife(game, getOpponentSymbol(playerSymbol))}</span>
    </div>
  );

}

export const PlayerHand = ({ game, playerSymbol }) => {
    if (!playerSymbol) return;

    const playerHand = game.hands[playerSymbol] || {};
    console.log(playerHand);
    const { cards = [], count = 0 } = playerHand;

    return (
      <div className="hand game-info">
        <div className="count">
          {count > 0 ? `Your Hand Count: ${count}` : "Your Hand is Empty"}
        </div>
        <div className="cards-container">
          {cards.map((card, index) => (
            <Card key={index} card={card} />
          ))}
        </div>
      </div>
    );
    
  }
  export const PlayerDeck = ({ game, playerSymbol }) => {
    if (!playerSymbol) return;

    const playerDeck = game.decks[playerSymbol] || {};
    console.log(playerDeck);
    const { cards = [], count = 0 } = playerDeck;

    return (
      <div className="hand game-info">
        <div className="count">Your Deck: {count} Cards</div>
        {count === 0 ? (
          <CardEmpty />
        ) : (
          <CardBack/> 
        )}
      </div>
    );
  }
  export const PlayerGraveyard = ({ game, playerSymbol, isOpponent, makeMove={makeMove} }) => {
    const [, ref] = useDrop(() => ({
      accept: 'CARD',
      drop: (item, monitor) => {
        if (item.type === 'Card' && !isOpponent) {
          makeMove("discard", { "cardid": item.id });
        }
      }
    }));
  
    if (!playerSymbol) return null;
  
    const playerGraveyard = game.graveyards[playerSymbol] || {};
    const { cards = [], count = 0 } = playerGraveyard;
  
    // Assuming the last card in the array is the top card of the graveyard
    const topCard = cards[count - 1];
  
    return (
      <div ref={ref} className={`hand game-info ${count === 0 ? 'white-outline' : ''}`}>
        {isOpponent ? (<div className="count">Your Graveyard: {count} Cards</div>) : (<div className="count">Opponent Graveyard: {count} Cards</div>)}
        {count === 0 ? (
          <CardEmpty />
        ) : (
          <Card key={topCard.id} card={topCard} /> // Render the top card from the graveyard
        )}
      </div>
    );
  };
  
  export const OtherPlayerHand = ({ game, playerSymbol }) => {
    if (!playerSymbol) return null;
  
    const playerHand = game.hands[playerSymbol] || {};
    console.log(playerHand);
    const { count = 0 } = playerHand;
  
    return (
      <div className="hand game-info">
        <div className="count">
          {count > 0 ? `Opponent Hand Count: ${count} Cards` : "Opponent Hand Empty"}
        </div>
        <div className="cards-container">
          {Array.from({ length: count }).map((_, index) => (
            <CardBack/>
          ))}
        </div>
      </div>
    );    
  };
  export const OtherPlayerDeck = ({ game, playerSymbol }) => {
    if (!playerSymbol) return null;
  
    const playerDeck = game.decks[playerSymbol] || {};
    const { count = 0 } = playerDeck;
  
    return (
      <div className="other-deck hand game-info">
        <div className="count">Opponent Deck: {count} Cards</div>
        {count === 0 ? (
          <CardEmpty />
        ) : (
          <CardBack/> 
        )}
      </div>
    );
  };
    