// GalagaComponents.js

import React from 'react';

// const imageDictionary = {
//     // ship: "/path/to/your/ship/image.png",
//     // enemyBasic: "/path/to/your/basic/enemy/image.png",
//     // enemyAdvanced: "/path/to/your/advanced/enemy/image.png", // if you have multiple enemy types
//     blaster: "/images/mfergalaga/5666.png"
// };
  
export const ShipComponent = ({ x, y }) => {
    return (
        <img src="/images/mfergalaga/cowboy.png" style={{ position: 'absolute', left: x, top: y, height: '40px' }} alt="cowboy" />
    );
};



export const EnemyComponent = ({ x, y }) => (
    <img src="/images/mfergalaga/cowboyahead.png" style={{ position: 'absolute', left: x, top: y, height: '30px' }} alt="enemy" />
);

export const BlasterComponent = ({ x, y, fromEnemy }) => {
    const blasterImageSrc = fromEnemy ? "/images/mfergalaga/1234.png" : "/images/mfergalaga/5666.png";
    return (
        <img src={blasterImageSrc} style={{ position: 'absolute', left: x, top: y, width: '15px', height: '15px' }} alt="blaster" />
    );
};
