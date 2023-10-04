import { Card, CardEmpty } from './Card';
import { useDrop } from 'react-dnd';

export const Bunker = ({ bunker, index, isOpponent, makeMove }) => {
    const { cards = [], count = 0 } = bunker;
    const topCard = cards[0];
  
    // Create a drop ref for this specific bunker
    const [, dropRef] = useDrop(() => ({
      accept: 'CARD',
      drop: (item, monitor) => {
        if (item.type === 'Card' && !isOpponent) {
          makeMove("bunkerize", { "cardid": item.id, "bunkerIndex": index });
        }
      }
    }));
  
    return (
      <div ref={dropRef} className={`${count === 0 ? 'white-outline' : ''}`}>
        <div className="count">Bunker {index+1}</div>
        {topCard ? (
          <Card key={topCard.id} card={topCard} />
        ) : (
          <CardEmpty />
        )}
      </div>
    );
  };

export default Bunker;
