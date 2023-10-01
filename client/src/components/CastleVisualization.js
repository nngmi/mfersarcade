import React from 'react';

const CastleVisualization = ({ wallHealth, towerHealth }) => {
  return (
    <div>
      <svg viewBox="0 0 100 100" width="200px" height="200px">
        {/* Wall States */}
        <g style={{ display: wallHealth > 66 ? 'inline' : 'none' }}>
          <rect x="10" y="30" width="80" height="10" fill="grey" /> {/* Full Wall */}
        </g>
        
        <g style={{ display: wallHealth <= 66 && wallHealth > 33 ? 'inline' : 'none' }}>
          <polygon points="10,30 30,40 50,30 70,40 90,30" fill="grey" /> {/* Partially Broken Wall */}
        </g>
        
        <g style={{ display: wallHealth <= 33 ? 'inline' : 'none' }}>
          <line x1="10" y1="35" x2="90" y2="35" stroke="grey" strokeWidth="2" /> {/* Fully Broken Wall */}
        </g>
        
        {/* Tower States */}
        <g style={{ display: towerHealth > 20 ? 'inline' : 'none' }}>
          <rect x="40" y="10" width="20" height="30" fill="grey" /> {/* Full Tower */}
        </g>
        
        <g style={{ display: towerHealth <= 20 && towerHealth > 10 ? 'inline' : 'none' }}>
          <polygon points="40,20 60,20 50,10" fill="grey" /> {/* Partially Broken Tower */}
        </g>
        
        <g style={{ display: towerHealth <= 10 ? 'inline' : 'none' }}>
          <line x1="50" y1="10" x2="50" y2="40" stroke="grey" strokeWidth="2" /> {/* Fully Broken Tower */}
        </g>
      </svg>
    </div>
  );
};

export default CastleVisualization;
