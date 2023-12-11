import React from 'react';
import { Piece, PieceProps } from './Piece';

interface SquareProps {
  size: number;
  color: string;
  piece: PieceProps | undefined;
}

function maybePiece (piece: PieceProps | undefined) {
    if (piece !== undefined) {
        return <Piece id={piece.id} color={piece.color} type={piece.type} position={piece.position}/>;
    } else {
        return <></>;
    }
}

const Square: React.FC<SquareProps> = ({ size, color, piece }) => {
  const squareStyle: React.CSSProperties = {
    width: `${size}px`,
    height: `${size}px`,
    backgroundColor: `${color}`,
    border: '1px solid #000',
  };

  return <div style={squareStyle}>{maybePiece(piece)}</div>;
};

export default Square;