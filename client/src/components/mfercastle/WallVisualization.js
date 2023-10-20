import React, { useRef, useEffect } from 'react';

const TILE_WIDTH = 8;
const TILE_HEIGHT = 8;
const PADDING = 2;

const WallTile = ({ x, y }) => ({
  sourceX: x * (TILE_WIDTH + 1) + 1,
  sourceY: y * (TILE_HEIGHT + 1) + 1,
  width: TILE_WIDTH,
  height: TILE_HEIGHT,
});

const wallWidth = 2;

const WallVisualization = ({ maxWallHeight = 10, wallHeight = 10, scaleFactor = 3 }) => {
  const canvasRef = useRef(null);
  const maxHeight = TILE_HEIGHT * scaleFactor * maxWallHeight;

  useEffect(() => {
    const ctx = canvasRef.current.getContext('2d');
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

    const tilesetImage = new Image();
    tilesetImage.src = '/images/mixed_tileset.png';
    tilesetImage.onload = () => {
      const wallTile = WallTile({ x: 9, y: 9 });

      let currentHeight = maxHeight - TILE_HEIGHT * scaleFactor;
      for (let i = 0; i < wallHeight; i++) {
        for (let j = 1; j < wallWidth + 1; j++) {
          ctx.drawImage(
            tilesetImage,
            wallTile.sourceX, wallTile.sourceY, wallTile.width, wallTile.height,
            j * wallTile.width * scaleFactor, currentHeight,
            wallTile.width * scaleFactor + PADDING, wallTile.height * scaleFactor + PADDING
          );
        }
        currentHeight -= wallTile.height * scaleFactor;
      }
    };
  }, [wallHeight]);

  return <canvas ref={canvasRef} width={TILE_WIDTH * scaleFactor * (wallWidth + 2)} height={maxHeight} />;
};

export default WallVisualization;
