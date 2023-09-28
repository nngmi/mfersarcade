import React from 'react';
import './Card.css'; // assuming you have a CSS file for styles
import { useDrag } from 'react-dnd';

export const Card = ({ card }) => {
const [, ref] = useDrag(() => ({
    type: 'CARD',
    item: { type: 'Card', id: card.id }
    }));
  const { name, color } = card;
  return (
    <div ref={ref} className={`card ${color}`}>
      {name}
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