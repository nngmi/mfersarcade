import React from 'react';
import './Card.css'; // assuming you have a CSS file for styles

export const Card = ({ card }) => {
  const { name, color } = card;
  return (
    <div className={`card ${color}`}>
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
