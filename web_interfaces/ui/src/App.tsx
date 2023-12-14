// App.tsx

import React from "react";
import { ChessGame } from "./components/Game";
import "./App.css";

const App: React.FC = () => {
  return (
    <div>
      <ChessGame />
    </div>
  );
};

export default App;
