// GalagaComponents.js

import React from 'react';

// const imageDictionary = {
//     // ship: "/path/to/your/ship/image.png",
//     // enemyBasic: "/path/to/your/basic/enemy/image.png",
//     // enemyAdvanced: "/path/to/your/advanced/enemy/image.png", // if you have multiple enemy types
//     blaster: "/images/mfergalaga/5666.png"
// };
  
export const ShipComponent = ({ x, y }) => <div style={{ position: 'absolute', left: x, top: y }}>🚀</div>;

export const EnemyComponent = ({ x, y }) => (
    <img src="/images/mfergalaga/5666.png" style={{ position: 'absolute', left: x, top: y, width: '50px', height: '50px' }} alt="blaster" />
);

export const BlasterComponent = ({ x, y }) => (
    <img src="/images/mfergalaga/5666.png" style={{ position: 'absolute', left: x, top: y, width: '15px', height: '15px' }} alt="blaster" />
);
