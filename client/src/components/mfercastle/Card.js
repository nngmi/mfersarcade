import React from 'react';
import './Card.css'; // assuming you have a CSS file for styles
import { useDrag } from 'react-dnd';

export const Card = ({ card }) => {
  const [, ref] = useDrag(() => ({
    type: 'CARD',
    item: { type: 'Card', id: card.id }
  }));
  console.log(card);
  const { name, color, text, cost, image } = card;
  return (
    <div>
      <div ref={ref} className={`card ${color}`} alt={card.id}>
        <div className="cardTitle">
          {name} {cost}
        </div>
        <div className="cardImage">
          <img src={`/images/mfercastle/cards/${image}`} alt="connect4"></img>
        </div>
        <div className="cardText">
          {text}
        </div>
      </div>
    </div>
  );
};

export const CardBack = () => {
  return (
    <div className={`card card-back`}>
    </div>
  );
};
export const CardEmpty = () => {
  return (
    <div className={`card card-empty`}>
    </div>
  );
};