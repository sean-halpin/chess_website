// Game.tsx

import React, {useEffect, useState} from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {Board} from './Board';
import {TextComponent} from './TextComponent';
import {ChessGame, MoveCommand, Team} from '@sean_halpin/chess_game';
import Sound from 'react-native-sound';

export interface GameProps {
  game: ChessGame;
  displayText: string;
  fen: string;
}

export const Game: React.FC = () => {
  const [player, setPlayer] = useState<Sound | null>(null);

  const prepareSound = () => {
    console.log('[Game] Loading Sound');

    const sound = new Sound(
      require('../../assets/audio/table_knock.wav'),
      Sound.MAIN_BUNDLE,
      error => {
        if (error) {
          console.error('[Game] Error loading sound:', error);
        } else {
          setPlayer(sound);

          console.log('[Game] Playing Sound');
          sound.play(success => {
            if (success) {
              console.log('[Game] Sound played successfully');
            } else {
              console.error('[Game] Error playing sound');
            }
          });
        }
      },
    );
  };

  useEffect(() => {
    return player
      ? () => {
          console.log('[Game] Unloading Sound');
          player.release();
        }
      : undefined;
  }, [player]);

  const [state, setState] = useState<GameProps>({
    game: new ChessGame(),
    displayText: '',
    fen: '',
  });

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async function executeCpuMoves(team: Team) {
    try {
      const res = await state.game.cpuMoveMinimax(team);
      if (res.success) {
        prepareSound();
        player?.play();
        setState(prevState => ({
          ...prevState,
          game: res.data,
        }));
      }
    } catch (err) {
      console.error('Error during CPU move:', err);
    }
  }

  useEffect(() => {
    const waitOneSecond = async () => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      if (state.game.currentPlayer === Team.Black) {
        // executeCpuMoves(Team.Black);
      }
    };
    if (
      !state.game.status?.includes('Checkmate') &&
      !state.game.status?.includes('Draw')
    ) {
      const curr_player = state.game.currentPlayer;
      const capitalized_player =
        curr_player.charAt(0).toUpperCase() + curr_player.slice(1);
      setState(prevState => ({
        ...prevState,
        displayText: `${capitalized_player} to move`,
      }));
      waitOneSecond();
    } else {
      setState(prevState => ({
        ...prevState,
        displayText: `${state.game.status}`,
      }));
    }
  }, [state.game]);

  const sendMoveCommand = (newCommand: MoveCommand) => {
    switch (newCommand.command) {
      case 'move':
        {
          const result = state.game.executeCommand(newCommand);
          if (result.success) {
            prepareSound();
            player?.play();
            setState(prevState => ({
              ...prevState,
              game: result.data,
            }));
          }
        }
        break;
      default:
        console.warn('[Game] Unknown command');
        break;
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Chess</Text>
      <View style={styles.row}>
        <View style={styles.column}>
          <View style={styles.chessBoard}>
            <Board
              pieces={state.game.pieces}
              sendMoveCommand={sendMoveCommand}
              legalMoves={ChessGame.findLegalMovesCurry(state.game.gameState)}
            />
          </View>
          <View>
            <TextComponent
              statusMessage={state.game.status || ''}
              nextToMove={`${state.game.currentPlayer} to move next`}
              fenString={state.fen}
            />
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chessBoard: {
    flex: 1,
    justifyContent: 'center',
  },
  header: {
    marginTop: 50,
    color: 'white',
  },
  text: {
    color: 'white',
  },
  column: {},
  row: {},
});
