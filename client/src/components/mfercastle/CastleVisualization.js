import React, { useRef, useEffect } from 'react';

const TILE_WIDTH = 8;
const TILE_HEIGHT = 8;
const PADDING = 2;

const CastleTile = ({ x, y }) => ({
  sourceX: x * (TILE_WIDTH + 1) + 1, // + x (1px buffer for each tile)
  sourceY: y * (TILE_HEIGHT + 1) + 1, // + y
  width: TILE_WIDTH,
  height: TILE_HEIGHT,
});

const towerWidth = 5;

const CastleVisualization = ({ maxTowerHeight=10, towerHeight=10, scaleFactor=3 }) => {
  const canvasRef = useRef(null);
  const maxHeight = TILE_HEIGHT * scaleFactor * (maxTowerHeight + 3);
  useEffect(() => {
    const ctx = canvasRef.current.getContext('2d');
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    
    const tilesetImage = new Image();
    tilesetImage.src = '/images/mixed_tileset.png';
    tilesetImage.onload = () => {
      // Define castle tiles
      const castleTile = CastleTile({ x: 9, y: 9 });

      const windowTile = CastleTile({ x: 10, y: 10 });

      const crownTile = CastleTile({ x: 14, y: 11 });
      const diagonalLeftTile = CastleTile({ x: 13, y: 9 });
      const diagonalRightTile = CastleTile({ x: 14, y: 9 });

      let currentHeight = maxHeight - TILE_HEIGHT * scaleFactor;
      for (let i = 0; i < towerHeight; i++) {
          for (let j = 1; j < towerWidth + 1; j++) {
              const tile = (i == towerHeight-1 && i > 2 && (j == 2 || j == 4)) ? windowTile : castleTile;
              ctx.drawImage(
                  tilesetImage,
                  tile.sourceX, tile.sourceY, tile.width, tile.height,
                  j * castleTile.width * scaleFactor, currentHeight, 
                  castleTile.width * scaleFactor + PADDING, castleTile.height * scaleFactor + PADDING
              );
          }
          currentHeight -= castleTile.height * scaleFactor;
      }

      // Drawing the first layer of the tower
      for (let j = 1; j < (towerWidth+1); j++) {
        ctx.drawImage(
            tilesetImage,
            castleTile.sourceX, castleTile.sourceY, castleTile.width, castleTile.height,
            j * castleTile.width * scaleFactor, currentHeight,
            castleTile.width * scaleFactor + PADDING, castleTile.height * scaleFactor + PADDING
        );
      }
      ctx.drawImage(
        tilesetImage,
        diagonalLeftTile.sourceX, diagonalLeftTile.sourceY, diagonalLeftTile.width, diagonalLeftTile.height,
        0 * castleTile.width * scaleFactor, currentHeight,
        castleTile.width * scaleFactor + PADDING, castleTile.height * scaleFactor + PADDING
      );
      ctx.drawImage(
        tilesetImage,
        diagonalRightTile.sourceX, diagonalRightTile.sourceY, diagonalRightTile.width, diagonalRightTile.height,
        (towerWidth+1) * castleTile.width * scaleFactor, currentHeight,
        castleTile.width * scaleFactor + PADDING, castleTile.height * scaleFactor + PADDING
      );
      currentHeight -= castleTile.height * scaleFactor;
      // draw another layer of full ones
      for (let j = 0; j < (towerWidth+2); j++) {
        ctx.drawImage(
            tilesetImage,
            castleTile.sourceX, castleTile.sourceY, castleTile.width, castleTile.height,
            j * castleTile.width * scaleFactor, currentHeight,
            castleTile.width * scaleFactor + PADDING, castleTile.height * scaleFactor + PADDING
        );
      }
      currentHeight -= castleTile.height * scaleFactor;

      // draw the crown
      for (let j = 0; j < (towerWidth + 2); j+=2) {
        ctx.drawImage(
            tilesetImage,
            crownTile.sourceX, crownTile.sourceY, crownTile.width, crownTile.height,
            j * castleTile.width * scaleFactor, currentHeight,
            castleTile.width * scaleFactor + PADDING, castleTile.height * scaleFactor + PADDING
        );
      }
      currentHeight -= castleTile.height * scaleFactor;
    };
  }, [towerHeight]);

  return <canvas ref={canvasRef} width={TILE_WIDTH * scaleFactor * (2 + towerWidth)} height={maxHeight} />;
};

export default CastleVisualization;
