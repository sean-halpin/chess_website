import { DndProvider } from "react-dnd";
import React, { useEffect, useRef, useState } from "react";
import Board from "./Board";
import "./css/Game.css";
import isTouchDevice from "is-touch-device";
import { TouchBackend } from "react-dnd-touch-backend";
import { HTML5Backend } from "react-dnd-html5-backend";
import AudioPlayer from "./AudioPlayer";
import { TextComponent } from "./TextComponent";
import { AiOptions, ChessGame, MoveCommand, Rank, Some, Team, defaultAiOptions } from "@sean_halpin/chess_game";

type HighlightTheme = "electric" | "sunset" | "mono" | "ocean" | "violet" | "lime";
const SETTINGS_KEY = "chess-website-settings";
const themes: Record<HighlightTheme, { label: string; selected: string; legal: string; last: string; lastText: string }> = {
  electric: { label: "Electric", selected: "#ffea00", legal: "#00e676", last: "#00e5ff", lastText: "#002b36" },
  sunset: { label: "Sunset", selected: "#ff4081", legal: "#ffea00", last: "#ff6d00", lastText: "#1b0b00" },
  mono: { label: "Mono", selected: "#ffffff", legal: "#bdbdbd", last: "#212121", lastText: "#ffffff" },
  ocean: { label: "Ocean", selected: "#40c4ff", legal: "#64ffda", last: "#2979ff", lastText: "#ffffff" },
  violet: { label: "Violet", selected: "#ea80fc", legal: "#b9f6ca", last: "#7c4dff", lastText: "#ffffff" },
  lime: { label: "Lime", selected: "#eeff41", legal: "#69f0ae", last: "#aeea00", lastText: "#1b2a00" },
};

const isHighlightTheme = (value: unknown): value is HighlightTheme =>
  value === "electric" || value === "sunset" || value === "mono" ||
  value === "ocean" || value === "violet" || value === "lime";

const isAiOptions = (value: unknown): value is AiOptions => {
  if (typeof value !== "object" || value === null) return false;
  const options = value as AiOptions;
  return Number.isInteger(options.maxDepth) && options.maxDepth >= 1 && options.maxDepth <= 6 &&
    Number.isInteger(options.timeLimitMs) && options.timeLimitMs >= 100 && options.timeLimitMs <= 10_000;
};
const loadSettings = (): { aiOptions: AiOptions; theme: HighlightTheme } => {
  try {
    const saved = JSON.parse(window.localStorage.getItem(SETTINGS_KEY) || "null") as { aiOptions?: unknown; theme?: unknown } | null;
    const savedAiOptions = saved?.aiOptions;
    const savedTheme = saved?.theme;
    return {
      aiOptions: isAiOptions(savedAiOptions) ? savedAiOptions : defaultAiOptions,
      theme: isHighlightTheme(savedTheme) ? savedTheme : "electric",
    };
  } catch {
    return { aiOptions: defaultAiOptions, theme: "electric" };
  }
};

export const Game: React.FC = () => {
  const initialSettings = useRef(loadSettings()).current;
  const audioPlayerRef = useRef<AudioPlayer>(null);
  const settingsRef = useRef<HTMLDivElement>(null);
  const [game, setGame] = useState(() => new ChessGame());
  const [renderVersion, setRenderVersion] = useState(0);
  const [pendingPromotion, setPendingPromotion] = useState<MoveCommand>();
  const [pendingDrawClaim, setPendingDrawClaim] = useState<MoveCommand>();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsSection, setSettingsSection] = useState<"ai" | "themes" | undefined>();
  const [aiOptions, setAiOptions] = useState<AiOptions>(initialSettings.aiOptions);
  const [theme, setTheme] = useState<HighlightTheme>(initialSettings.theme);
  const gameOver = ChessGame.isGameOver(game.gameState);
  const playAudio = () => audioPlayerRef.current?.play();
  const updateGame = (updatedGame: ChessGame) => { setGame(updatedGame); setRenderVersion((version) => version + 1); };

  useEffect(() => {
    try { window.localStorage.setItem(SETTINGS_KEY, JSON.stringify({ aiOptions, theme })); } catch { /* Storage is optional. */ }
  }, [aiOptions, theme]);
  useEffect(() => {
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) { setSettingsOpen(false); setSettingsSection(undefined); }
    };
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") { setSettingsOpen(false); setSettingsSection(undefined); } };
    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => { document.removeEventListener("mousedown", closeOnOutsideClick); document.removeEventListener("keydown", closeOnEscape); };
  }, []);

  const commitMove = (command: MoveCommand) => {
    const result = game.executeCommand(command);
    if (result.success) { playAudio(); updateGame(result.data); }
  };
  const sendMoveCommand = (command: MoveCommand) => {
    const matchingMoves = ChessGame.findLegalMoves(game.gameState, game.gameState.currentPlayer)
      .filter(({ command: legal }) => legal.source.isEqual(command.source) && legal.destination.isEqual(command.destination));
    if (command.promotionRank.isNone() && matchingMoves.some(({ command: legal }) => legal.promotionRank.isSome())) setPendingPromotion(command);
    else if (game.canClaimDraw(command) !== undefined) setPendingDrawClaim(command);
    else commitMove(command);
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
  const restart = () => { setPendingPromotion(undefined); setPendingDrawClaim(undefined); updateGame(new ChessGame()); };
  const undoTurn = () => {
    const result = game.undo(Math.min(2, Math.max(1, game.gameState.commands.length)));
    if (result.success) { setPendingPromotion(undefined); setPendingDrawClaim(undefined); updateGame(result.data); }
  };
  useEffect(() => {
    if (gameOver || game.currentPlayer !== Team.Black) return;
    const scheduledOptions = { ...aiOptions };
    const timer = window.setTimeout(() => {
      game.moveMinimax(Team.Black, scheduledOptions).then((result) => {
        if (result.success) { playAudio(); updateGame(result.data); }
      }).catch((error) => console.error("Error during CPU move:", error));
    }, 2000);
    return () => window.clearTimeout(timer);
  }, [game, gameOver, renderVersion, aiOptions]);

  const legalMoves = ChessGame.findLegalMoves(game.gameState, game.currentPlayer).map(({ command }) => command);
  const backend = isTouchDevice() ? TouchBackend : HTML5Backend;
  const palette = themes[theme];
  const themeStyle = {
    "--highlight-selected": palette.selected,
    "--highlight-legal": palette.legal,
    "--highlight-last": palette.last,
    "--highlight-last-text": palette.lastText,
  } as React.CSSProperties & Record<string, string>;
  const updateOption = (field: keyof AiOptions, value: number) => {
    const limits = field === "maxDepth" ? [1, 6] : [100, 10_000];
    setAiOptions((current) => ({ ...current, [field]: Math.max(limits[0], Math.min(limits[1], value)) }));
  };

  return <div className="game-shell" style={themeStyle}>
    <div className="header"><h1>Chess</h1>
      <div className="settings" ref={settingsRef}>
        <button className="burger-button" aria-label="Open settings" aria-expanded={settingsOpen} onClick={() => { setSettingsOpen((open) => !open); setSettingsSection(undefined); }}>☰</button>
        {settingsOpen && <div className="settings-menu" role="dialog" aria-label="Game settings">
          <button className="settings-section-button" aria-expanded={settingsSection === "ai"} onClick={() => setSettingsSection((section) => section === "ai" ? undefined : "ai")}>AI settings</button>
          {settingsSection === "ai" && <div className="settings-section">
            <label>AI depth <input aria-label="AI depth" type="number" min="1" max="6" value={aiOptions.maxDepth} onChange={(event) => updateOption("maxDepth", Number(event.target.value))} /></label>
            <label>Think time (ms) <input aria-label="Think time" type="number" min="100" max="10000" step="100" value={aiOptions.timeLimitMs} onChange={(event) => updateOption("timeLimitMs", Number(event.target.value))} /></label>
          </div>}
          <button className="settings-section-button" aria-expanded={settingsSection === "themes"} onClick={() => setSettingsSection((section) => section === "themes" ? undefined : "themes")}>Highlight themes</button>
          {settingsSection === "themes" && <div className="settings-section theme-options">{(Object.keys(themes) as HighlightTheme[]).map((name) =>
            <button key={name} className={theme === name ? "theme-active" : ""} onClick={() => { setTheme(name); setSettingsOpen(false); setSettingsSection(undefined); }}>{themes[name].label}</button>
          )}</div>}
        </div>}
      </div>
    </div>
    <div className="row"><div className="column" /><div className="column">
      <div className="chessBox"><DndProvider backend={backend}>
        <Board pieces={game.pieces} sendMoveCommand={sendMoveCommand} legalMoves={legalMoves} currentPlayer={game.currentPlayer} gameOver={gameOver} lastMove={game.gameState.commands.at(-1)?.command} interactionKey={renderVersion} />
      </DndProvider></div>
      <div className="game-controls"><button onClick={restart}>Restart</button><button onClick={undoTurn} disabled={game.gameState.commands.length === 0}>Undo turn</button></div>
      <div className="game-status">
        {game.currentPlayer === Team.White && game.canClaimDraw() !== undefined && !gameOver && <button onClick={() => claimDraw()}>Claim draw</button>}
        {pendingPromotion !== undefined && <div role="dialog" aria-label="Choose promotion"><p>Promote pawn to:</p>{[Rank.Queen, Rank.Rook, Rank.Bishop, Rank.Knight].map((rank) => <button key={rank} onClick={() => choosePromotion(rank)}>{rank}</button>)}</div>}
        {pendingDrawClaim !== undefined && <div role="dialog" aria-label="Claim draw"><p>This move permits a draw claim.</p><button onClick={() => claimDraw(pendingDrawClaim)}>Claim draw</button><button onClick={() => { commitMove(pendingDrawClaim); setPendingDrawClaim(undefined); }}>Play move</button></div>}
        <TextComponent statusMessage={game.gameState.drawReason || game.status || ""} nextToMove={`${game.currentPlayer} to move next`} fenString={game.getCurrentFen()} />
        <AudioPlayer ref={audioPlayerRef} />
      </div>
    </div><div className="column" /></div>
  </div>;
};
