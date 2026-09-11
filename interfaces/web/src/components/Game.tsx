import { DndProvider } from "react-dnd";
import React, { useEffect, useRef, useState } from "react";
import Board from "./Board";
import "./css/Game.css";
import isTouchDevice from "is-touch-device";
import { TouchBackend } from "react-dnd-touch-backend";
import { HTML5Backend } from "react-dnd-html5-backend";
import AudioPlayer from "./AudioPlayer";
import { TextComponent } from "./TextComponent";
import { ChessGame, MoveCommand, Rank, Some, Team } from "@sean_halpin/chess_game";

export const Game: React.FC = () => {
  const audioPlayerRef = useRef<AudioPlayer>(null);
  const [game, setGame] = useState(() => new ChessGame());
  const [renderVersion, setRenderVersion] = useState(0);
  const [pendingPromotion, setPendingPromotion] = useState<MoveCommand>();
  const [pendingDrawClaim, setPendingDrawClaim] = useState<MoveCommand>();
  const gameOver = ChessGame.isGameOver(game.gameState);
  const playAudio = () => audioPlayerRef.current?.play();
  const updateGame = (updatedGame: ChessGame) => {
    setGame(updatedGame);
    setRenderVersion((version) => version + 1);
  };
  const commitMove = (command: MoveCommand) => {
    const result = game.executeCommand(command);
    if (result.success) { playAudio(); updateGame(result.data); }
  };
  const sendMoveCommand = (command: MoveCommand) => {
    const matchingMoves = ChessGame.findLegalMoves(game.gameState, game.gameState.currentPlayer)
      .filter(({ command: legal }) => legal.source.isEqual(command.source) && legal.destination.isEqual(command.destination));
    if (command.promotionRank.isNone() && matchingMoves.some(({ command: legal }) => legal.promotionRank.isSome())) {
      setPendingPromotion(command);
    } else if (game.canClaimDraw(command) !== undefined) {
      setPendingDrawClaim(command);
    } else commitMove(command);
  };
  const choosePromotion = (rank: Rank) => {
    if (pendingPromotion === undefined) return;
    setPendingPromotion(undefined);
    sendMoveCommand(new MoveCommand(pendingPromotion.source, pendingPromotion.destination, Some(rank)));
  };
  const claimDraw = (command?: MoveCommand) => {
    const result = game.claimDraw(command);
    if (result.success) updateGame(result.data);
    setPendingDrawClaim(undefined);
  };
  useEffect(() => {
    if (gameOver || game.currentPlayer !== Team.Black) return;
    const timer = window.setTimeout(() => {
      game.moveMinimax(Team.Black).then((result) => {
        if (result.success) { playAudio(); updateGame(result.data); }
      }).catch((error) => console.error("Error during CPU move:", error));
    }, 2000);
    return () => window.clearTimeout(timer);
  }, [game, gameOver, renderVersion]);

  const legalMoves = (team: Team): MoveCommand[] =>
    ChessGame.findLegalMoves(game.gameState, team).map(({ command }) => command);
  const backend = isTouchDevice() ? TouchBackend : HTML5Backend;
  return <div>
    <div className="header"><h1>Chess</h1></div>
    <div className="topnav"><button>Connect</button></div>
    <div className="row"><div className="column" /><div className="column">
      <div className="chessBox"><DndProvider backend={backend}>
        <Board pieces={game.pieces} sendMoveCommand={sendMoveCommand} legalMoves={legalMoves} />
      </DndProvider></div>
      <div>
        {game.currentPlayer === Team.White && game.canClaimDraw() !== undefined && !gameOver && <button onClick={() => claimDraw()}>Claim draw</button>}
        {pendingPromotion !== undefined && <div role="dialog" aria-label="Choose promotion"><p>Promote pawn to:</p>
          {[Rank.Queen, Rank.Rook, Rank.Bishop, Rank.Knight].map((rank) => <button key={rank} onClick={() => choosePromotion(rank)}>{rank}</button>)}
        </div>}
        {pendingDrawClaim !== undefined && <div role="dialog" aria-label="Claim draw"><p>This move permits a draw claim.</p>
          <button onClick={() => claimDraw(pendingDrawClaim)}>Claim draw</button>
          <button onClick={() => { commitMove(pendingDrawClaim); setPendingDrawClaim(undefined); }}>Play move</button>
        </div>}
        <TextComponent statusMessage={game.gameState.drawReason || game.status || ""} nextToMove={`${game.currentPlayer} to move next`} fenString={game.getCurrentFen()} />
        <AudioPlayer ref={audioPlayerRef} />
      </div>
    </div><div className="column" /></div>
  </div>;
};
