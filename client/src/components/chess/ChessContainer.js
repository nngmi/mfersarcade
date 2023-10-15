import React, { useState, useEffect } from "react";
import {graphics, getPlayerColor} from './ChessLib';
import './ChessContainer.css';

function ChessContainer({game, playerId, makeMove}) {

    const [selectedSquare, setSelectedSquare] = useState(null);
    const handleSquareClick = (rowIndex, cellIndex) => {
        const actualRow = getPlayerColor(game, playerId) === 'black' ? 7 - rowIndex : rowIndex;
        const selectedPiece = game.board[actualRow][cellIndex];
        console.log("clicking on ", actualRow, cellIndex, selectedPiece);
    
        // If a piece is already selected
        if (selectedSquare) {
            // Execute the move if it's valid (You can add more validation checks here)
            makeMove(selectedSquare, { row: rowIndex, col: cellIndex });
            setSelectedSquare(null);
        } else if (selectedPiece && ((selectedPiece === selectedPiece.toUpperCase() && getPlayerColor(game, playerId) === 'white') || (selectedPiece !== selectedPiece.toUpperCase() && getPlayerColor(game, playerId) === 'black'))) {
            console.log("setting selected piece to ", rowIndex, cellIndex);
            setSelectedSquare({ row: rowIndex, col: cellIndex });

        }
    };
    const lastMove = game.moves.length > 0 ? game.moves[game.moves.length - 1] : null;
    const secondLastMove = game.moves.length > 1 ? game.moves[game.moves.length - 2] : null;

    const isLastMoveSquare = (row, col) => {
        const cellName = `${String.fromCharCode(97 + col)}${8 - row}`;
        return lastMove && (cellName === lastMove.from || cellName === lastMove.to);
    };

    const isSecondLastMoveSquare = (row, col) => {
        const cellName = `${String.fromCharCode(97 + col)}${8 - row}`;
        return secondLastMove && (cellName === secondLastMove.from || cellName === secondLastMove.to);
    };
    const lastMoveByCurrentPlayer = game.moves.length > 0 && getPlayerColor(game, playerId) === (game.moves.length % 2 === 0 ? 'black' : 'white');

    return (
        <>
    <div className="chess-container">
    <div className="row-labels">
        {(getPlayerColor(game, playerId) === 'black' ? [' ', '1', '2', '3', '4', '5', '6', '7', '8'] : [' ', '8', '7', '6', '5', '4', '3', '2', '1']).map(label => (
            <div key={label} className="row-label">{label}</div>
        ))}
    </div>
    <div className="chessboard-wrapper">
        <div className="column-labels">
            {['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'].map(label => (
                <div key={label} className="column-label">{label}</div>
            ))}
        </div>
        <div className="chessboard">
            {(getPlayerColor(game, playerId) === 'black' ? game.board.slice().reverse() : game.board).map((row, rowIndex) => (
                row.map((cell, cellIndex) => {
                    const isDarkSquare = getPlayerColor(game, playerId) === 'white'
                        ? (rowIndex + cellIndex) % 2 !== 0
                        : (rowIndex + cellIndex) % 2 === 0;

                    return (
                        <div 
                            key={`${rowIndex}-${cellIndex}`}
                            className={`
                                square 
                                ${isDarkSquare ? 'black-square' : 'white-square'}
                                ${selectedSquare && selectedSquare.row === rowIndex && selectedSquare.col === cellIndex ? 'selected' : ''}
                                ${isLastMoveSquare(rowIndex, cellIndex) && lastMoveByCurrentPlayer ? 'last-move-self' : ''}
                                ${isLastMoveSquare(rowIndex, cellIndex) && !lastMoveByCurrentPlayer ? 'last-move-opponent' : ''}
                                ${isSecondLastMoveSquare(rowIndex, cellIndex) && !lastMoveByCurrentPlayer ? 'second-last-move-self' : ''}
                                ${isSecondLastMoveSquare(rowIndex, cellIndex) && lastMoveByCurrentPlayer ? 'second-last-move-opponent' : ''}
                            `}
                            onClick={() => handleSquareClick(rowIndex, cellIndex)}
                        >
                            {cell && (
                                <img
                                    src={graphics[`${cell.toLowerCase()}-${cell === cell.toUpperCase() ? 'white' : 'black'}`]}
                                    alt={cell}
                                    className="piece-img"
                                />
                            )}
                        </div>
                    );
                })
            ))}
        </div>
    </div>
    </div>
    </>
    )
}

export default ChessContainer;