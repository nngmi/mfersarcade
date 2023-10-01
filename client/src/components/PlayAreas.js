import { Card, CardBack, CardEmpty } from './Card';
import { useDrop } from 'react-dnd';
import './PlayAreas.css'; // assuming you have a CSS file for styles
import CastleVisualization from './CastleVisualization';

export const PlayerGameState = ({ game, playerSymbol }) => {
  function getPlayer(game, playerSymbol) {
    return game.players.find(player => player.symbol === playerSymbol) || {};
  }

  const {
    castleStrength = null,
    wallStrength = null,
    generators = null,
    spendingResources = null,
    drawsLeft = null,
    discardsLeft = null,
  } = getPlayer(game, playerSymbol);

  return (
    <div>
      <div className="marginSpan">Tower Strength: {castleStrength}</div>
      <div className="marginSpan">Wall Strength: {wallStrength}</div>
      <div className="marginSpan">Generators: {generators}</div>
      <div className="marginSpan">Spending Resource: {spendingResources}</div>
      <div className="marginSpan">Draws Left: {drawsLeft}</div>
      <div className="marginSpan">Discards Left: {discardsLeft}</div>
    </div>
  );
}
export const PlayerCastleVisualization = ({ game, playerSymbol }) => {
  function getPlayer(game, playerSymbol) {
    return game.players.find(player => player.symbol === playerSymbol) || {};
  }

  const {
    castleStrength = null,
    wallStrength = null,
  } = getPlayer(game, playerSymbol);

  return (
    <div>
      <CastleVisualization towerHealth={castleStrength} wallHealth={wallStrength}/>
    </div>
  );
}

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
      <span className="marginSpan">Turn Number: {game.turnNumber}</span>
    </div>
  );
}

export const PlayerHand = ({ game, playerSymbol }) => {
  if (!playerSymbol) return null;

  const playerHand = game.hands[playerSymbol] || {};
  console.log(playerHand);
  const { cards = [], count = 0 } = playerHand;

  return (
    <div className="grow-width hand game-info">
      <div className="count">
        {count > 0 ? `Your Hand Count: ${count}` : "Your Hand is Empty"}
      </div>
      <div className="cards-container">
        {game.state === "waiting for other player" ?
          cards.map((card, index) => (
            <CardBack key={card.id} />
          ))
          :
          cards.map((card, index) => (
            <Card key={card.id} card={card} />
          ))
        }
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
    <div className="fixed-width hand game-info">
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
    <div ref={ref} className={`fixed-width game-info ${count === 0 ? 'white-outline' : ''}`}>
      {isOpponent ? (<div className="count">Opponent Graveyard: {count} Cards</div>) : (<div className="count">Your Graveyard: {count} Cards</div>)}
      {count === 0 ? (
        <CardEmpty />
      ) : (
        <Card key={topCard.id} card={topCard} /> // Render the top card from the graveyard
      )}
    </div>
  );
};


export const PlayerBattlefield = ({ game, playerSymbol, isOpponent, makeMove={makeMove} }) => {
  const [, ref] = useDrop(() => ({
    accept: 'CARD',
    drop: (item, monitor) => {
      if (item.type === 'Card' && !isOpponent) {
        makeMove("play", { "cardid": item.id });
      }
    }
  }));

  if (!playerSymbol) return null;

  const battlefield = game.battlefields[playerSymbol] || {};
  const { cards = [], count = 0 } = battlefield;

  return (
    <div ref={ref} className={`grow-width hand game-info ${count === 0 ? 'white-outline' : ''}`}>
      {isOpponent ? (<div className="count">Opponent Battlefield: {count} Cards</div>) : (<div className="count">Your Battlefield: {count} Cards</div>)}
      <div className="cards-container">
        {cards.map((card, index) => (
          <Card key={index} card={card} />
        ))}
      </div>
    </div>
  );
};


export const OtherPlayerHand = ({ game, playerSymbol }) => {
  if (!playerSymbol) return null;

  const playerHand = game.hands[playerSymbol] || {};
  console.log(playerHand);
  const { count = 0 } = playerHand;

  return (
    <div className="grow-width hand game-info">
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
    <div className="fixed-width other-deck hand game-info">
      <div className="count">Opponent Deck: {count} Cards</div>
      {count === 0 ? (
        <CardEmpty />
      ) : (
        <CardBack/> 
      )}
    </div>
  );
};