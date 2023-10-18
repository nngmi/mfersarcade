// GalagaComponents.js

import React from 'react';

export const ShipComponent = ({ x, y }) => <div style={{ position: 'absolute', left: x, top: y }}>🚀</div>;

export const EnemyComponent = ({ x, y, type }) => <div style={{ position: 'absolute', left: x, top: y }}>👾</div>;

export const BlasterComponent = ({ x, y }) => <div style={{ position: 'absolute', left: x, top: y }}>-</div>;
