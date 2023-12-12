// App.tsx

import React from 'react';
import ChessGame from './components/Game';
import './App.css'


const App: React.FC = () => {
  return (
    <div>
      <h1>App</h1>
      <ChessGame />
    </div>
  );
};

export default App;